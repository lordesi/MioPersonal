{{-- Plain text: {!! !!} because "&" or "'" must stay as they are, there is no HTML here. --}}
La tua seduta è confermata

{!! $trainerName !!} ti aspetta.{!! array_filter($contacts) ? ' Qui sotto trovi i suoi contatti, per qualsiasi dettaglio prima della seduta.' : '' !!}

{!! $day !!}, {!! $card['time'] !!}
{!! $card['title'] !!}
{!! $card['subtitle'] !!}
@foreach (array_filter([...$contacts, 'Indicazioni' => $arrivalNotes]) as $label => $value)
{!! $label !!}: {!! $value !!}
@endforeach

Vedi la prenotazione:
{!! $url !!}

@if ($cancelUntil !== null)
Cancellazione gratuita fino a {!! $cancelUntil !!}. Se non puoi più venire, annulla dalla tua area: lo slot torna libero per altri.
@else
Il tempo per annullare gratis è passato: se non puoi più venire, avvisa il trainer.
@endif

A presto,
Il team di MioPersonal
