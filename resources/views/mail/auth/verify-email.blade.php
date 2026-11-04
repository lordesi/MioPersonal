{{-- "Conferma la tua email", after signing up (AppServiceProvider). Variables: $name, $url, $validity ("24 ore") --}}
@extends('mail.layouts.base')

@section('title', 'Conferma la tua email')
@section('preheader', 'Un clic e il tuo account MioPersonal è attivo.')
@section('label', 'Conferma email')
@section('footer', 'Hai ricevuto questa email perché il tuo indirizzo è stato usato per creare un account su MioPersonal.')

@section('content')
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">{{ filled($name) ? "Ciao {$name}, benvenuto!" : 'Ciao, benvenuto!' }}</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">Ti manca solo un passo: conferma il tuo indirizzo email per attivare l'account e iniziare a prenotare le tue sedute.</p>

@include('mail.partials.button', ['url' => $url, 'label' => 'Conferma la tua email'])
@include('mail.partials.note', ['text' => "Il link è valido per {$validity}. Se non hai creato tu un account su MioPersonal, ignora questa email: non succederà nulla."])
@include('mail.partials.fallback-link', ['url' => $url, 'label' => 'Conferma la tua email'])
@endsection
