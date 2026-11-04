{{--
    The layout of the emails (design: docs/design, "MioPersonal · Email automatiche").
    Built for Gmail, Apple Mail and Outlook: tables for the layout, inline styles,
    at most 600px wide, no JavaScript, no SVG. The classes "mp-*" only switch
    colors in dark mode and sizes on phones.

    Sections:
      title     → the title of the tab, not shown in the body
      preheader → the preview after the subject, in the list of the inbox
      label     → top right of the black header (e.g. "Conferma email")
      content   → the email
      footer    → why the person gets this email (optional)
--}}
<!DOCTYPE html>
<html lang="it" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>@yield('title', 'MioPersonal')</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table,td,div,p,a,span,h1,strong{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark;}
body{margin:0;padding:0;width:100% !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
table{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}
td{mso-line-height-rule:exactly;}
img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}
a{text-decoration:none;}
a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important;}
u + #body a{color:inherit;text-decoration:none;font-size:inherit;font-family:inherit;font-weight:inherit;line-height:inherit;}
@media only screen and (max-width:620px){
  .mp-outer{padding:16px 8px 24px !important;}
  .mp-pad{padding-left:24px !important;padding-right:24px !important;}
  .mp-body{padding-top:32px !important;padding-bottom:28px !important;}
  .mp-h1{font-size:24px !important;line-height:30px !important;}
  .mp-hide-sm{display:none !important;}
  .mp-btn-t{width:100% !important;}
  .mp-btn-a{display:block !important;text-align:center !important;}
  .mp-tile{width:64px !important;}
}
@media (prefers-color-scheme: dark){
  .mp-bg{background-color:#0a0a0a !important;}
  .mp-head{background-color:#171717 !important;border-bottom:1px solid #27272a !important;}
  .mp-card{background-color:#171717 !important;}
  .mp-ink{color:#fafafa !important;}
  .mp-text{color:#d4d4d8 !important;}
  .mp-muted{color:#a1a1aa !important;}
  .mp-soft{background-color:#262626 !important;}
  .mp-line{border-color:#3f3f46 !important;}
  .mp-btn-td{background-color:#ffffff !important;}
  .mp-btn-a{background-color:#ffffff !important;color:#0a0a0a !important;}
  .mp-bar{border-left-color:#fafafa !important;}
  .mp-link{color:#fafafa !important;}
}
[data-ogsc] .mp-ink{color:#fafafa !important;}
[data-ogsc] .mp-text{color:#d4d4d8 !important;}
[data-ogsc] .mp-muted{color:#a1a1aa !important;}
[data-ogsc] .mp-link{color:#fafafa !important;}
[data-ogsb] .mp-card{background-color:#171717 !important;}
[data-ogsb] .mp-head{background-color:#171717 !important;}
[data-ogsb] .mp-soft{background-color:#262626 !important;}
[data-ogsb] .mp-btn-a{background-color:#ffffff !important;color:#0a0a0a !important;}
</style>
</head>
<body id="body" class="mp-bg" style="margin:0;padding:0;background-color:#f4f4f5;word-spacing:normal;">
<div role="article" aria-roledescription="email" lang="it" class="mp-bg" style="background-color:#f4f4f5;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f4f5;opacity:0;">@yield('preheader')&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f4f5" class="mp-bg" style="width:100%;background-color:#f4f4f5;">
<tr>
<td align="center" class="mp-outer" style="padding:40px 16px 32px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;margin:0 auto;">

<tr>
<td bgcolor="#0a0a0a" class="mp-head mp-pad" style="background-color:#0a0a0a;border-radius:20px 20px 0 0;padding:22px 40px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
<tr>
<td valign="middle" style="font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<a href="{{ config('app.url') }}" target="_blank" style="text-decoration:none;color:#ffffff;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0">
<tr>
<td valign="middle" style="padding-right:10px;"><img src="{{ asset('images/email/logo-white.png') }}" width="33" height="20" alt="" style="display:block;width:33px;height:20px;border:0;"></td>
<td valign="middle" style="font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;line-height:24px;font-weight:700;letter-spacing:-0.3px;color:#ffffff;">MioPersonal</td>
</tr>
</table>
</a>
</td>
<td align="right" valign="middle" class="mp-hide-sm" style="font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;line-height:16px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:#a1a1aa;">@yield('label')</td>
</tr>
</table>
</td>
</tr>

<tr>
<td bgcolor="#ffffff" class="mp-card mp-pad mp-body" style="background-color:#ffffff;border-radius:0 0 20px 20px;padding:40px 40px 36px;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
@yield('content')
<p class="mp-text" style="margin:32px 0 0;font-size:15px;line-height:22px;color:#3f3f46;">A presto,<br><strong class="mp-ink" style="color:#0a0a0a;font-weight:600;">Il team di MioPersonal</strong></p>
</td>
</tr>

<tr>
<td align="center" class="mp-pad mp-muted" style="padding:24px 40px 0;font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#71717a;">
@yield('footer', 'Hai ricevuto questa email perché hai un account su MioPersonal.')<br>
<a href="{{ config('app.url') }}" target="_blank" class="mp-muted" style="color:#52525b;text-decoration:underline;">miopersonal.it</a>&nbsp;&nbsp;·&nbsp;&nbsp;© {{ date('Y') }} MioPersonal
</td>
</tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</div>
</body>
</html>
