<x-mail::message>
@if ($isCopy)
{{-- Only fixed text: whatever is typed in the form could be used to send spam from our address. --}}
# Grazie per averci scritto

Abbiamo ricevuto il tuo messaggio su «{{ $contact['topicLabel'] }}» e ti rispondiamo appena possibile, a questo indirizzo.

Se non ci hai scritto tu, ignora questa email.

Il team di {{ config('app.name') }}
@else
# Nuovo messaggio dalla pagina Contatti

Rispondi a questa email per scrivere direttamente a {{ $contact['name'] }}.

<x-mail::panel>
**Sei:** {{ $contact['roleLabel'] }}<br>
**Argomento:** {{ $contact['topicLabel'] }}<br>
**Nome:** {{ $contact['name'] }}<br>
**Email:** {{ $contact['email'] }}
</x-mail::panel>

{{-- e() escapes the text, nl2br() keeps the line breaks the person typed. --}}
{!! nl2br(e($contact['message'])) !!}
@endif
</x-mail::message>
