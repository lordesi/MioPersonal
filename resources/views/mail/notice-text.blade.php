{{-- Plain text of mail/notice: {!! !!} because "&" or "'" must stay as they are, there is no HTML here. --}}
{!! $title !!}
@foreach (($paragraphs ?? []) as $paragraph)

{!! $paragraph !!}
@endforeach
@if (count($items ?? []))

@foreach ($items as $item)
- {!! $item !!}
@endforeach
@endif
@if (array_filter($details ?? []))

@foreach (array_filter($details) as $label => $value)
{!! $label !!}: {!! $value !!}
@endforeach
@endif
@if (filled($body ?? null))

{!! $body !!}
@endif
@if (($url ?? null) !== null && ($button ?? null) !== null)

{!! $button !!}:
{!! $url !!}
@endif
@if (($note ?? null) !== null)

{!! $note !!}
@endif

A presto,
Il team di MioPersonal
