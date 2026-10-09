<x-mail::message>
@if ($isCopy)
# Grazie, {{ $contact['name'] }}

Abbiamo ricevuto il tuo messaggio e ti rispondiamo appena possibile. Eccone una copia.
@else
# Nuovo messaggio dalla pagina Contatti

Rispondi a questa email per scrivere direttamente a {{ $contact['name'] }}.
@endif

<x-mail::panel>
**Sei:** {{ $contact['roleLabel'] }}<br>
**Argomento:** {{ $contact['topicLabel'] }}<br>
**Nome:** {{ $contact['name'] }}<br>
**Email:** {{ $contact['email'] }}
</x-mail::panel>

{{-- e() escapes the text, nl2br() keeps the line breaks the person typed. --}}
{!! nl2br(e($contact['message'])) !!}

@if ($isCopy)
Il team di {{ config('app.name') }}
@endif
</x-mail::message>
