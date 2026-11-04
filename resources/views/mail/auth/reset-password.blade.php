{{-- "Reimposta la password" (AppServiceProvider). Variables: $url, $validity ("60 minuti") --}}
@extends('mail.layouts.base')

@section('title', 'Reimposta la password')
@section('preheader', 'Ecco il link per scegliere una nuova password.')
@section('label', 'Password')

@section('content')
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">Reimposta la password</h1>
<p class="mp-text" style="margin:0;font-size:16px;line-height:25px;color:#3f3f46;">Abbiamo ricevuto una richiesta per reimpostare la password del tuo account MioPersonal. Clicca il pulsante per sceglierne una nuova.</p>

@include('mail.partials.button', ['url' => $url, 'label' => 'Scegli una nuova password'])
@include('mail.partials.note', ['text' => "Il link è valido per {$validity}. Se non hai chiesto tu il cambio, ignora questa email: la tua password resta la stessa."])
@include('mail.partials.fallback-link', ['url' => $url, 'label' => 'Scegli una nuova password'])
@endsection
