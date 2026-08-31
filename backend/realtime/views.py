import json
import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
def get_realtime_token(request):
    scenario_id = request.data.get('scenario_id', 'default')

    try:
        response = requests.post(
            'https://api.openai.com/v1/realtime/client_secrets',
            headers={
                'Authorization': f'Bearer {settings.OPENAI_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'session': {
                    'type': 'realtime',
                    'model': 'gpt-realtime-mini',
                }
            },
            timeout=10,
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'OpenAI request failed: {str(e)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    data = response.json()
    return Response(data, status=status.HTTP_200_OK)


FEEDBACK_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "grammar": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 1, "maximum": 10},
                "comment": {"type": "string"},
            },
            "required": ["score", "comment"],
            "additionalProperties": False,
        },
        "fluency": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 1, "maximum": 10},
                "comment": {"type": "string"},
            },
            "required": ["score", "comment"],
            "additionalProperties": False,
        },
        "vocabulary": {
            "type": "object",
            "properties": {
                "score": {"type": "integer", "minimum": 1, "maximum": 10},
                "comment": {"type": "string"},
            },
            "required": ["score", "comment"],
            "additionalProperties": False,
        },
        "corrections": {
            "type": "array",
            "maxItems": 5,
            "items": {
                "type": "object",
                "properties": {
                    "original": {"type": "string"},
                    "corrected": {"type": "string"},
                    "explanation": {"type": "string"},
                },
                "required": ["original", "corrected", "explanation"],
                "additionalProperties": False,
            },
        },
        "better_expressions": {
            "type": "array",
            "maxItems": 5,
            "items": {
                "type": "object",
                "properties": {
                    "original": {"type": "string"},
                    "suggestion": {"type": "string"},
                },
                "required": ["original", "suggestion"],
                "additionalProperties": False,
            },
        },
        "summary": {"type": "string"},
    },
    "required": ["grammar", "fluency", "vocabulary", "corrections", "better_expressions", "summary"],
    "additionalProperties": False,
}


def _format_transcript(transcript_entries):
    lines = []
    for entry in transcript_entries:
        speaker = 'User' if entry.get('role') == 'user' else 'AI'
        lines.append(f"{speaker}: {entry.get('text', '')}")
    return '\n'.join(lines)


def _call_openai_for_feedback(transcript_text, scenario_level):
    system_prompt = (
        "You are an English language coach reviewing a practice conversation transcript. "
        "Your job is to teach, not to continue the conversation. "
        f"The user's target level is {scenario_level} (CEFR).\n\n"

        "SCORING RUBRIC — use the FULL 1-10 range. Do not default to the middle out of "
        "politeness or to avoid sounding harsh. The written comments can stay warm and "
        "encouraging in tone, but the numeric scores must be strictly evidence-based, "
        "independent of how kind the comment sounds:\n"
        "  9-10: Near-native. No grammar errors. Wide, precise, natural vocabulary for the level.\n"
        "  7-8:  Strong. Only minor, non-disruptive errors. Good range of vocabulary, natural phrasing.\n"
        "  5-6:  Adequate for the stated level. Some noticeable grammar mistakes and/or repetitive, "
        "basic vocabulary, but the message is always understandable.\n"
        "  3-4:  Frequent errors that sometimes obscure meaning. Very limited or repeated vocabulary. "
        "Responses are short, fragmented, or rely heavily on single words.\n"
        "  1-2:  Barely functional English, mostly incorrect, or almost no real attempt to use English.\n\n"

        "How to judge each category from a VOICE transcript (you cannot hear pacing or hesitation, "
        "only the transcribed text, so infer from what is actually written):\n"
        "  - grammar: correctness of tense, articles, word order, agreement — count real errors, "
        "don't invent ones that aren't there.\n"
        "  - fluency: sentence length, completeness and complexity of the user's turns. A user who only "
        "gives one- or two-word answers the whole session should score LOW on fluency (3-4 or lower) "
        "even if those words were grammatically correct — short answers are not fluent conversation.\n"
        "  - vocabulary: range and precision of words used relative to the target level, not just "
        "whether the words used were correct.\n\n"

        "Also factor in how much the user actually spoke: a very short or thin transcript (few user "
        "turns, mostly minimal responses) should generally NOT receive high scores across the board, "
        "since there isn't enough evidence of strong ability — reflect that uncertainty with lower, "
        "more conservative scores rather than assuming the best.\n\n"

        "Limit corrections to at most 5 items — pick the most important ones, "
        "do not turn this into an exhaustive error list. "
        "Only include real mistakes the user actually made in the transcript below; "
        "do not invent issues that are not present."
    )

    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {settings.OPENAI_API_KEY}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'gpt-4o-mini',
            'temperature': 0.3,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': f"Transcript:\n\n{transcript_text}"},
            ],
            'response_format': {
                'type': 'json_schema',
                'json_schema': {
                    'name': 'feedback',
                    'strict': True,
                    'schema': FEEDBACK_JSON_SCHEMA,
                },
            },
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json()


@api_view(['POST'])
def get_feedback(request):
    transcript_entries = request.data.get('transcript', [])
    scenario_level = request.data.get('scenario_level', 'A2')

    if not transcript_entries:
        return Response(
            {'error': 'Transcript cannot be empty.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    transcript_text = _format_transcript(transcript_entries)

    last_error = None
    for attempt in range(2):
        try:
            raw = _call_openai_for_feedback(transcript_text, scenario_level)
            content_str = raw['choices'][0]['message']['content']
            feedback_json = json.loads(content_str)

            return Response(feedback_json, status=status.HTTP_200_OK)
        except (requests.exceptions.RequestException, KeyError, json.JSONDecodeError) as e:
            last_error = str(e)
            continue

    return Response(
        {'error': f'Could not get feedback: {last_error}'},
        status=status.HTTP_502_BAD_GATEWAY,
    )