<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * "Messaggi": photos besides the PDFs, and attachments that last
 * Message::ATTACHMENT_DAYS. Once expired the file is deleted and the path
 * emptied; the kind and the name stay to show "Foto non più disponibile".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment_kind', 10)->nullable()->after('body');
            // The space of the photo in the bubble before it loads.
            $table->unsignedSmallInteger('attachment_width')->nullable()->after('attachment_size');
            $table->unsignedSmallInteger('attachment_height')->nullable()->after('attachment_width');

            // messages:expire-attachments
            $table->index('created_at');
        });

        DB::table('messages')->whereNotNull('attachment_path')->update(['attachment_kind' => 'pdf']);
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropColumn(['attachment_kind', 'attachment_width', 'attachment_height']);
        });
    }
};
