{{-- Plain text: {!! !!} because "&" or "'" must stay as they are, there is no HTML here. --}}
@if ($alreadyConfirmed)
{!! $clientName !!} ha prenotato una seduta con te

Con la conferma automatica è già confermata: non devi fare nulla.
@else
{!! $clientName !!} vuole allenarsi con te

Hai tempo fino a {!! $expiresAt !!} per rispondere. Se non rispondi, la richiesta scade e lo slot torna libero.
@endif

{!! $day !!}, {!! $card['time'] !!}
{!! $card['title'] !!}
{!! $card['subtitle'] !!}
Cliente: {!! $isNewClient ? "{$clientName} · nuovo cliente" : $clientName !!}
@if (filled($clientNote))
Messaggio: {!! $clientNote !!}
@endif

{!! $alreadyConfirmed ? 'Vedi la tua giornata' : 'Rispondi alla richiesta' !!}:
{!! $url !!}

A presto,
Il team di MioPersonal
