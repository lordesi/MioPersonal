{{--
    Riquadro grigio con le informazioni in righe "etichetta → valore".
    Variabili: $rows = ['Etichetta' => 'valore', ...]. Le righe con valore vuoto non vengono mostrate.
--}}
@php
    $rows = array_filter($rows ?? [], fn ($value) => filled($value));
@endphp
@if (count($rows))
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f4f5" class="mp-soft" style="width:100%;background-color:#f4f4f5;border-radius:14px;border-collapse:separate;margin:12px 0 0;">
<tr><td style="padding:8px 0;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
@foreach ($rows as $label => $value)
<tr>
<td valign="top" class="mp-muted" style="width:40%;padding:8px 12px 8px 20px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#71717a;">{{ $label }}</td>
<td valign="top" class="mp-ink" style="padding:8px 20px 8px 0;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;color:#0a0a0a;word-break:break-word;">{{ $value }}</td>
</tr>
@endforeach
</table>
</td></tr>
</table>
@endif
