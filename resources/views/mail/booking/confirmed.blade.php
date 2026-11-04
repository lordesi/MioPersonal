{{--
    To the client, when the session is confirmed (BookingConfirmed).
    Variables: $card (BookingMailData::card()), $day, $trainerName,
               $contacts (Telefono, Email: only the ones the trainer shows), $arrivalNotes,
               $cancelUntil (null once cancelling is no longer free), $url
--}}
@extends('mail.layouts.base')

@section('title', 'Seduta confermata')
@section('preheader', ucfirst($day).", {$card['time']} con {$trainerName}. ".(array_filter($contacts) ? 'Dentro trovi i suoi contatti.' : 'Dentro trovi tutti i dettagli.'))
@section('label', 'Confermata')

@section('content')
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">La tua seduta è confermata</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">{{ $trainerName }} ti aspetta.{{ array_filter($contacts) ? ' Qui sotto trovi i suoi contatti, per qualsiasi dettaglio prima della seduta.' : '' }}</p>

@include('mail.partials.booking', [...$card, 'status' => 'confirmed', 'statusLabel' => 'Confermata'])
@include('mail.partials.details', ['rows' => [...$contacts, 'Indicazioni' => $arrivalNotes]])

@include('mail.partials.button', ['url' => $url, 'label' => 'Vedi la prenotazione'])
@include('mail.partials.note', ['text' => $cancelUntil !== null
    ? "Cancellazione gratuita fino a {$cancelUntil}. Se non puoi più venire, annulla dalla tua area: lo slot torna libero per altri."
    : 'Il tempo per annullare gratis è passato: se non puoi più venire, avvisa il trainer.'])
@endsection
