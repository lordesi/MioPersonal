{{--
    To the trainer, when a client books (BookingRequested): a request to answer by
    $expiresAt or, with "Conferma automatica", a session already confirmed.
    Variables: $card (BookingMailData::card() + subtitle), $day, $clientName, $isNewClient,
               $clientNote, $alreadyConfirmed, $expiresAt, $url
--}}
@extends('mail.layouts.base')

@section('title', $alreadyConfirmed ? 'Nuova prenotazione' : 'Nuova richiesta di prenotazione')
@section('preheader', $alreadyConfirmed
    ? "{$day}, {$card['time']}: già confermata con la conferma automatica."
    : "Hai tempo fino a {$expiresAt} per confermare la seduta di {$day}.")
@section('label', $alreadyConfirmed ? 'Nuova prenotazione' : 'Nuova richiesta')
@section('footer', 'Ricevi questa email perché hai un profilo trainer su MioPersonal.')

@section('content')
@if ($alreadyConfirmed)
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">{{ $clientName }} ha prenotato una seduta con te</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">Con la conferma automatica è già confermata: non devi fare nulla.</p>
@else
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">{{ $clientName }} vuole allenarsi con te</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">Hai tempo fino a <strong class="mp-ink" style="color:#0a0a0a;">{{ $expiresAt }}</strong> per rispondere. Se non rispondi, la richiesta scade e lo slot torna libero.</p>
@endif

@include('mail.partials.booking', [
    ...$card,
    'status' => $alreadyConfirmed ? 'confirmed' : 'pending',
    'statusLabel' => $alreadyConfirmed ? 'Confermata' : 'Da confermare',
])
@include('mail.partials.details', ['rows' => [
    'Cliente' => $isNewClient ? "{$clientName} · nuovo cliente" : $clientName,
    'Messaggio' => $clientNote,
]])

@if ($alreadyConfirmed)
@include('mail.partials.button', ['url' => $url, 'label' => 'Vedi la tua giornata'])
@else
@include('mail.partials.button', ['url' => $url, 'label' => 'Rispondi alla richiesta'])
@include('mail.partials.note', ['text' => 'Vuoi confermare in automatico le prossime richieste? Attiva la conferma automatica in Disponibilità.'])
@endif
@endsection
