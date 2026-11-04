{{-- The link to copy when the button doesn't work. Variables: $url, $label (the text of the button) --}}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:28px 0 0;">
<tr>
<td class="mp-line mp-muted" style="border-top:1px solid #e4e4e7;padding-top:20px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#71717a;">
Il pulsante «{{ $label }}» non funziona? Copia e incolla questo link nel browser:<br>
<a href="{{ $url }}" target="_blank" class="mp-link" style="color:#0a0a0a;text-decoration:underline;word-break:break-all;">{{ $url }}</a>
</td>
</tr>
</table>
