<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfilAnakController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $anak = $request->user()->anak;
        abort_unless($anak, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $anak->update($data);

        return back()->with('success', 'Profil anak berhasil diperbarui.');
    }
}
