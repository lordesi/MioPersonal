{{-- Plain text: {!! !!} because "&" or "'" must stay as they are, there is no HTML here. --}}
{!! $title !!}

{!! $intro !!}

{!! $day !!}, {!! $card['time'] !!}
{!! $card['title'] !!}
{!! $card['subtitle'] !!}
@foreach (array_filter($details) as $label => $value)
{!! $label !!}: {!! $value !!}
@endforeach

{!! $button !!}:
{!! $url !!}

@if ($note !== null)
{!! $note !!}

@endif
Puoi spegnere i promemoria dalle impostazioni del tuo account.

A presto,
Il team di MioPersonal
