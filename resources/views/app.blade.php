<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#f5f2ec">
        <link rel="icon" href="{{ Vite::asset('resources/images/favicon.ico') }}" type="image/x-icon">
        @inertiaHead
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>
        @inertia
    </body>
</html>
