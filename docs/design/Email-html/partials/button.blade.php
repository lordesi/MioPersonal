{{-- Pulsante principale. Variabili: $url, $label --}}
<table role="presentation" cellspacing="0" cellpadding="0" border="0" class="mp-btn-t" style="margin:28px 0 4px;">
<tr>
<td class="mp-btn-td" style="border-radius:12px;" bgcolor="#0a0a0a">
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $url }}" style="height:52px;v-text-anchor:middle;width:300px;" arcsize="24%" stroke="f" fillcolor="#0a0a0a">
<w:anchorlock/>
<center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;">{{ $label }}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="{{ $url }}" target="_blank" class="mp-btn-a" style="display:inline-block;background-color:#0a0a0a;color:#ffffff;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:20px;font-weight:600;text-decoration:none;padding:16px 28px;border-radius:12px;">{{ $label }}&nbsp;&nbsp;&rarr;</a>
<!--<![endif]-->
</td>
</tr>
</table>
