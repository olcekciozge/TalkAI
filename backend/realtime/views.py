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
        f"The user's target level is {scenario_level}. "
        "Give constructive, encouraging feedback. "
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
            {'error': 'Transcript bos olamaz.'},
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
        {'error': f'Feedback alinamadi: {last_error}'},
        status=status.HTTP_502_BAD_GATEWAY,
    )