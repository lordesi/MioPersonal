{{--
    A generic email with the MioPersonal layout: a title, a few paragraphs, and
    optionally a list, a grey box, a message, a note and a button. Used by the
    emails that don't need a special card (the decision on a profile, an event
    cancelled or moved, the messages of the Contatti page).

    Variables:
      $title, $label (top right of the header), $paragraphs (list of strings)
      $items     → list of strings shown as bullets (optional)
      $details   → ['Label' => 'value'] grey box (optional)
      $body      → text written by a person, keeps its line breaks (optional)
      $note      → note with the black bar (optional)
      $button, $url → main button (optional)
      $footer    → why the person gets this email (optional)
--}}
@extends('mail.layouts.base')

@php
    $paragraphs = $paragraphs ?? [];
    $items = $items ?? [];
    $details = $details ?? [];
    $body = $body ?? null;
    $note = $note ?? null;
    $button = $button ?? null;
    $url = $url ?? null;
@endphp

@section('title', $title)
@section('preheader', $paragraphs[0] ?? $title)
@section('label', $label ?? '')
@isset($footer)
@section('footer', $footer)
@endisset

@section('content')
<h1 class="mp-h1 mp-ink" style="margin:0 0 12px;font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:#0a0a0a;">{{ $title }}</h1>
@foreach ($paragraphs as $index => $paragraph)
<p class="mp-text" style="margin:{{ $index === 0 ? '0' : '12px 0 0' }};font-size:16px;line-height:25px;color:#3f3f46;">{{ $paragraph }}</p>
@endforeach

@if (count($items))
<ul class="mp-text" style="margin:12px 0 0;padding:0 0 0 20px;font-size:16px;line-height:25px;color:#3f3f46;">
@foreach ($items as $item)
<li style="margin:0 0 4px;">{{ $item }}</li>
@endforeach
</ul>
@endif

@if (array_filter($details))
@include('mail.partials.details', ['rows' => $details])
@endif

@if (filled($body))
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f4f5" class="mp-soft" style="width:100%;background-color:#f4f4f5;border-radius:14px;border-collapse:separate;margin:12px 0 0;">
<tr><td class="mp-text" style="padding:16px 20px;font-size:15px;line-height:23px;color:#3f3f46;white-space:pre-line;word-break:break-word;">{{ $body }}</td></tr>
</table>
@endif

@if ($url !== null && $button !== null)
@include('mail.partials.button', ['url' => $url, 'label' => $button])
@endif
@if ($note !== null)
@include('mail.partials.note', ['text' => $note])
@endif
@endsection
