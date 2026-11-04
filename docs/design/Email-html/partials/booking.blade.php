{{--
    Scheda della seduta, con il riquadro nero della data.
    Variabili: $weekday (es. "mer"), $day (es. "28"), $month (es. "ott"), $time (es. "13:00–14:00"),
               $title (es. "Seduta singola"), $subtitle (es. "con Alessandro Siligato · Online"),
               $status ("pending" | "confirmed" | "declined"), $statusLabel (testo del badge)
--}}
@php
    $badgeStyle = match ($status ?? 'pending') {
        'confirmed' => 'background-color:#0a0a0a;color:#ffffff;border:1px solid #0a0a0a;',
        'declined' => 'background-color:#f4f4f5;color:#71717a;border:1px solid #e4e4e7;',
        default => 'background-color:#ffffff;color:#0a0a0a;border:1px dashed #a1a1aa;',
    };
@endphp
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" class="mp-line" style="width:100%;border-collapse:separate;border:1px solid #e4e4e7;border-radius:16px;margin:24px 0 0;">
<tr>
<td width="80" valign="middle" align="center" bgcolor="#0a0a0a" class="mp-tile" style="width:80px;background-color:#0a0a0a;border-radius:15px 0 0 15px;padding:16px 0;text-align:center;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:1.2px;color:#a1a1aa;">{{ mb_strtoupper($weekday) }}</div>
<div style="font-size:30px;line-height:36px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">{{ $day }}</div>
<div style="font-size:11px;line-height:14px;font-weight:700;letter-spacing:1.2px;color:#a1a1aa;">{{ mb_strtoupper($month) }}</div>
</td>
<td valign="middle" style="padding:16px 20px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div class="mp-ink" style="font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.3px;color:#0a0a0a;">{{ $time }}</div>
<div class="mp-text" style="font-size:15px;line-height:22px;font-weight:600;color:#3f3f46;">{{ $title }}</div>
<div class="mp-muted" style="font-size:14px;line-height:20px;color:#71717a;">{{ $subtitle }}</div>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px;border-collapse:separate;">
<tr><td style="{{ $badgeStyle }}border-radius:999px;padding:4px 10px;font-size:12px;line-height:16px;font-weight:700;">{{ $statusLabel }}</td></tr>
</table>
</td>
</tr>
</table>
