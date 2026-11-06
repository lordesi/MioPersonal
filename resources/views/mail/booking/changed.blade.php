{{--
    A confirmed session changed (BookingChanged): cancelled, or another time proposed / accepted / declined.
    Variables: $title, $intro, $label, $card (BookingMailData::card()), $cancelled, $details,
               $note, $button, $url, $toTrainer
--}}
@extends('mail.layouts.base')

@section('title', $title)
@section('preheader', $intro)
@section('label', $label)
@if ($toTrainer)
@section('footer', 'Ricevi questa email perché hai un profilo trainer su MioPersonal.')
@endif

@section('content')
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">{{ $title }}</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">{{ $intro }}</p>

@include('mail.partials.booking', [...$card, 'status' => $cancelled ? 'pending' : 'confirmed', 'statusLabel' => $label])
@if (array_filter($details))
@include('mail.partials.details', ['rows' => $details])
@endif

@include('mail.partials.button', ['url' => $url, 'label' => $button])
@if ($note !== null)
@include('mail.partials.note', ['text' => $note])
@endif
@endsection
