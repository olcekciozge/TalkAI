import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


@api_view(['POST'])
def get_realtime_token(request):
    """
    Mobil uygulamanın çağıracağı endpoint.
    Kendi gerçek OpenAI API key'imizi kullanarak OpenAI'den
    kısa ömürlü (ephemeral) bir client_secret alır ve onu döner.
    Gerçek API key asla mobil uygulamaya gitmez.
    """
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
