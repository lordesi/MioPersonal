<?php

namespace Tests\Feature;

use App\Actions\Account\DeleteUser;
use App\Actions\Trainer\DeleteTrainerProfile;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\TrainerClient;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** "Messaggi" between a trainer and their clients with an account. */
class MessagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake(Message::DISK);
    }

    /** A trainer and a registered client in their "Clienti". */
    private function pair(): TrainerClient
    {
        $profile = TrainerProfile::factory()->approved()->create();

        return TrainerClient::query()->forceCreate([
            'trainer_profile_id' => $profile->id,
            'user_id' => User::factory()->create()->id,
            'name' => 'Marco Rossi',
        ]);
    }

    private function trainerOf(TrainerClient $record): User
    {
        return $record->trainerProfile->user;
    }

    private function clientOf(TrainerClient $record): User
    {
        /** @var User */
        return $record->user;
    }

    public function test_trainer_and_client_write_to_each_other()
    {
        $record = $this->pair();

        $this->actingAs($this->trainerOf($record))
            ->postJson(route('messages.store', $record), ['body' => 'Ciao Marco, domani alle 18?'])
            ->assertCreated()
            ->assertJsonPath('message.mine', true)
            ->assertJsonPath('message.body', 'Ciao Marco, domani alle 18?');

        $this->actingAs($this->clientOf($record))
            ->getJson(route('messages.poll', ['record' => $record, 'after' => 0]))
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.mine', false);

        $this->actingAs($this->clientOf($record))
            ->postJson(route('messages.store', $record), ['body' => 'Perfetto!'])
            ->assertCreated();

        $this->actingAs($this->trainerOf($record))
            ->get(route('trainer.messages', ['con' => $record->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('trainer/messages')
                ->where('conversations.0.recordId', $record->id)
                ->where('conversations.0.lastMessage.text', 'Perfetto!')
                ->where('selected.name', $this->clientOf($record)->name)
                ->has('selected.messages', 2));
    }

    public function test_the_list_shows_new_messages_until_the_conversation_is_opened()
    {
        $record = $this->pair();
        $this->actingAs($this->clientOf($record))->postJson(route('messages.store', $record), ['body' => 'Ciao']);

        $this->actingAs($this->trainerOf($record))
            ->get(route('trainer.messages'))
            ->assertInertia(fn (Assert $page) => $page->where('conversations.0.unread', true)->where('selected', null));

        $this->actingAs($this->trainerOf($record))->get(route('trainer.messages', ['con' => $record->id]));

        $this->actingAs($this->trainerOf($record))
            ->get(route('trainer.messages'))
            ->assertInertia(fn (Assert $page) => $page->where('conversations.0.unread', false));
    }

    public function test_the_client_page_lists_their_trainers()
    {
        $record = $this->pair();

        $this->actingAs($this->clientOf($record))
            ->get(route('client.messages'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('client/messages')
                ->where('conversations.0.name', $this->trainerOf($record)->name)
                ->where('conversations.0.lastMessage', null));
    }

    public function test_the_poll_gives_only_the_messages_after_the_last_one()
    {
        $record = $this->pair();
        $trainer = $this->trainerOf($record);
        $first = $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => 'Uno'])->json('message.id');
        $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => 'Due']);

        $this->actingAs($this->clientOf($record))
            ->getJson(route('messages.poll', ['record' => $record, 'after' => $first]))
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.body', 'Due');
    }

    public function test_older_messages_come_a_page_at_a_time()
    {
        $record = $this->pair();
        $conversation = Conversation::query()->create(['trainer_client_id' => $record->id]);
        foreach (range(1, Message::PAGE + 5) as $number) {
            $conversation->messages()->create(['sender_id' => $record->user_id, 'body' => "Messaggio {$number}"]);
        }
        $firstShown = (int) $conversation->messages()->orderByDesc('id')->skip(Message::PAGE - 1)->value('id');

        $this->actingAs($this->trainerOf($record))
            ->get(route('trainer.messages', ['con' => $record->id]))
            ->assertInertia(fn (Assert $page) => $page->has('selected.messages', Message::PAGE)->where('selected.hasOlder', true));

        $this->actingAs($this->trainerOf($record))
            ->getJson(route('messages.older', ['record' => $record, 'before' => $firstShown]))
            ->assertJsonCount(5, 'messages')
            ->assertJsonPath('messages.0.body', 'Messaggio 1')
            ->assertJsonPath('hasOlder', false);
    }

    public function test_others_cannot_read_or_write()
    {
        $record = $this->pair();
        $this->actingAs($this->trainerOf($record))->postJson(route('messages.store', $record), [
            'attachment' => UploadedFile::fake()->create('scheda.pdf', 100, 'application/pdf'),
        ]);
        $message = Message::query()->sole();

        foreach ([User::factory()->create(), TrainerProfile::factory()->approved()->create()->user] as $stranger) {
            $this->actingAs($stranger)->getJson(route('messages.poll', $record))->assertNotFound();
            $this->actingAs($stranger)->getJson(route('messages.older', $record))->assertNotFound();
            $this->actingAs($stranger)->postJson(route('messages.store', $record), ['body' => 'Ciao'])->assertNotFound();
            $this->actingAs($stranger)->get(route('messages.download', ['record' => $record, 'message' => $message]))->assertNotFound();
        }

        $this->assertSame(1, Message::query()->count());
    }

    public function test_nobody_can_write_to_a_client_without_an_account()
    {
        $profile = TrainerProfile::factory()->approved()->create();
        $record = $profile->clientRecords()->create(['name' => 'Giulia Bianchi']);

        $this->actingAs($profile->user)->postJson(route('messages.store', $record), ['body' => 'Ciao'])->assertNotFound();
        $this->actingAs($profile->user)
            ->get(route('trainer.messages'))
            ->assertInertia(fn (Assert $page) => $page->has('conversations', 0));
    }

    public function test_a_pdf_is_sent_and_downloaded_with_its_name()
    {
        $record = $this->pair();

        $this->actingAs($this->trainerOf($record))
            ->postJson(route('messages.store', $record), [
                'attachment' => UploadedFile::fake()->create('Scheda marzo.pdf', 300, 'application/pdf'),
            ])
            ->assertCreated()
            ->assertJsonPath('message.body', null)
            ->assertJsonPath('message.attachment.name', 'Scheda marzo.pdf');

        $message = Message::query()->sole();
        $this->assertNotNull($message->attachment_path);
        Storage::disk(Message::DISK)->assertExists($message->attachment_path);

        $this->actingAs($this->clientOf($record))
            ->get(route('messages.download', ['record' => $record, 'message' => $message]))
            ->assertOk()
            ->assertDownload('Scheda marzo.pdf');
    }

    public function test_only_pdfs_up_to_10_mb_and_never_an_empty_message()
    {
        $record = $this->pair();
        $trainer = $this->trainerOf($record);

        $this->actingAs($trainer)->postJson(route('messages.store', $record), [
            'attachment' => UploadedFile::fake()->image('foto.jpg'),
        ])->assertJsonValidationErrors(['attachment' => 'Puoi allegare solo file PDF.']);

        $this->actingAs($trainer)->postJson(route('messages.store', $record), [
            'attachment' => UploadedFile::fake()->create('grande.pdf', Message::ATTACHMENT_MAX_KB + 1, 'application/pdf'),
        ])->assertJsonValidationErrors('attachment');

        $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => '   '])
            ->assertJsonValidationErrors(['body' => 'Scrivi un messaggio o allega una foto o un PDF.']);

        $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => str_repeat('a', Message::BODY_MAX + 1)])
            ->assertJsonValidationErrors('body');

        $this->assertSame(0, Message::query()->count());
    }

    public function test_a_photo_is_sent_shown_and_downloaded()
    {
        $record = $this->pair();

        $response = $this->actingAs($this->clientOf($record))
            ->postJson(route('messages.store', $record), [
                'body' => 'La mia colazione',
                'photo' => UploadedFile::fake()->image('IMG_0001.jpg', 1200, 900),
            ])
            ->assertCreated()
            ->assertJsonPath('message.body', 'La mia colazione')
            ->assertJsonPath('message.attachment.kind', 'photo')
            ->assertJsonPath('message.attachment.width', 1200)
            ->assertJsonPath('message.attachment.height', 900)
            ->assertJsonPath('message.attachment.expired', false);

        $message = Message::query()->sole();
        $this->assertSame(Message::KIND_PHOTO, $message->attachment_kind);
        $this->assertStringStartsWith("chat/{$message->conversation_id}/", (string) $message->attachment_path);
        Storage::disk(Message::DISK)->assertExists((string) $message->attachment_path);
        $this->assertNotNull($response->json('message.attachment.src'));

        $this->actingAs($this->trainerOf($record))
            ->get(route('messages.photo', ['record' => $record, 'message' => $message]))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');

        $this->actingAs($this->trainerOf($record))
            ->get(route('messages.download', ['record' => $record, 'message' => $message]))
            ->assertOk()
            ->assertDownload();

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get(route('messages.photo', ['record' => $record, 'message' => $message]))->assertNotFound();
    }

    public function test_a_photo_alone_shows_as_foto_in_the_list()
    {
        $record = $this->pair();
        $this->actingAs($this->clientOf($record))->postJson(route('messages.store', $record), [
            'photo' => UploadedFile::fake()->image('a.png', 400, 400),
        ])->assertCreated();

        $this->actingAs($this->trainerOf($record))
            ->get(route('trainer.messages'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('conversations.0.lastMessage.text', 'Foto')
                ->where('conversations.0.lastMessage.attachment', 'photo'));
    }

    public function test_the_photo_of_another_conversation_is_not_found()
    {
        $record = $this->pair();
        $other = $this->pair();
        $this->actingAs($this->clientOf($other))->postJson(route('messages.store', $other), [
            'photo' => UploadedFile::fake()->image('a.jpg', 400, 400),
        ])->assertCreated();
        $message = Message::query()->sole();

        $this->actingAs($this->trainerOf($record))
            ->get(route('messages.photo', ['record' => $record, 'message' => $message]))
            ->assertNotFound();
    }

    public function test_only_jpg_or_png_photos_and_never_with_a_pdf()
    {
        $record = $this->pair();
        $trainer = $this->trainerOf($record);

        $this->actingAs($trainer)->postJson(route('messages.store', $record), [
            'photo' => UploadedFile::fake()->create('scheda.pdf', 100, 'application/pdf'),
        ])->assertJsonValidationErrors('photo');

        $this->actingAs($trainer)->postJson(route('messages.store', $record), [
            'photo' => UploadedFile::fake()->image('a.jpg'),
            'attachment' => UploadedFile::fake()->create('scheda.pdf', 100, 'application/pdf'),
        ])->assertJsonValidationErrors(['photo' => 'Manda la foto e il PDF in due messaggi.']);

        $this->actingAs($trainer)->postJson(route('messages.store', $record), [
            'photo' => UploadedFile::fake()->image('a.jpg')->size(Message::PHOTO_MAX_KB + 1),
        ])->assertJsonValidationErrors('photo');

        $this->assertSame(0, Message::query()->count());
    }

    public function test_the_attachments_expire_but_the_text_stays()
    {
        $record = $this->pair();
        $client = $this->clientOf($record);
        $this->actingAs($client)->postJson(route('messages.store', $record), [
            'body' => 'Ecco la foto',
            'photo' => UploadedFile::fake()->image('a.jpg', 400, 400),
        ]);
        $this->actingAs($client)->postJson(route('messages.store', $record), [
            'attachment' => UploadedFile::fake()->create('esami.pdf', 100, 'application/pdf'),
        ]);
        [$photo, $pdf] = Message::query()->orderBy('id')->get()->all();
        $photoPath = (string) $photo->attachment_path;

        $this->travel(Message::ATTACHMENT_DAYS - 1)->days();
        $this->artisan('messages:expire-attachments')->assertSuccessful();
        Storage::disk(Message::DISK)->assertExists($photoPath);

        $this->travel(2)->days();
        $this->artisan('messages:expire-attachments')->assertSuccessful();

        Storage::disk(Message::DISK)->assertMissing($photoPath);
        $this->assertNull($photo->fresh()?->attachment_path);
        $this->assertNull($pdf->fresh()?->attachment_path);
        $this->assertSame('Ecco la foto', $photo->fresh()?->body);

        $this->actingAs($this->trainerOf($record))
            ->getJson(route('messages.poll', ['record' => $record, 'after' => 0]))
            ->assertJsonPath('messages.0.body', 'Ecco la foto')
            ->assertJsonPath('messages.0.attachment.kind', 'photo')
            ->assertJsonPath('messages.0.attachment.expired', true)
            ->assertJsonPath('messages.0.attachment.src', null)
            ->assertJsonPath('messages.1.attachment.kind', 'pdf')
            ->assertJsonPath('messages.1.attachment.name', 'esami.pdf')
            ->assertJsonPath('messages.1.attachment.href', null);

        $this->actingAs($this->trainerOf($record))
            ->get(route('messages.photo', ['record' => $record, 'message' => $photo]))
            ->assertNotFound();
        $this->actingAs($this->trainerOf($record))
            ->get(route('messages.download', ['record' => $record, 'message' => $pdf]))
            ->assertNotFound();
    }

    public function test_the_poll_says_when_the_other_person_read()
    {
        $record = $this->pair();
        $this->actingAs($this->trainerOf($record))->postJson(route('messages.store', $record), ['body' => 'Ciao']);

        $this->actingAs($this->trainerOf($record))
            ->getJson(route('messages.poll', ['record' => $record, 'after' => 0]))
            ->assertJsonPath('otherReadAt', null);

        $this->actingAs($this->clientOf($record))->get(route('client.messages', ['con' => $record->id]));

        $this->actingAs($this->trainerOf($record))
            ->getJson(route('messages.poll', ['record' => $record, 'after' => 0]))
            ->assertJsonPath('otherReadAt', fn ($value) => is_string($value));
    }

    public function test_sending_is_throttled()
    {
        $record = $this->pair();
        $trainer = $this->trainerOf($record);

        foreach (range(1, 30) as $ignored) {
            $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => 'Ciao'])->assertCreated();
        }

        $this->actingAs($trainer)->postJson(route('messages.store', $record), ['body' => 'Ciao'])->assertTooManyRequests();
    }

    public function test_closing_the_trainer_profile_deletes_the_messages_and_the_pdfs()
    {
        $record = $this->pair();
        $this->actingAs($this->trainerOf($record))->postJson(route('messages.store', $record), [
            'attachment' => UploadedFile::fake()->create('scheda.pdf', 100, 'application/pdf'),
        ]);
        $path = (string) Message::query()->value('attachment_path');

        app(DeleteTrainerProfile::class)->handle($record->trainerProfile);

        $this->assertSame(0, Conversation::query()->count());
        $this->assertSame(0, Message::query()->count());
        Storage::disk(Message::DISK)->assertMissing($path);
    }

    public function test_deleting_the_client_account_deletes_the_messages_and_the_pdfs()
    {
        $record = $this->pair();
        $this->actingAs($this->clientOf($record))->postJson(route('messages.store', $record), [
            'body' => 'Ecco i miei esami',
            'attachment' => UploadedFile::fake()->create('esami.pdf', 100, 'application/pdf'),
        ]);
        $path = (string) Message::query()->value('attachment_path');

        app(DeleteUser::class)->handle($this->clientOf($record));

        $this->assertSame(0, Message::query()->count());
        Storage::disk(Message::DISK)->assertMissing($path);
        // The trainer keeps their record of the client.
        $this->assertNotNull($record->fresh());
    }
}
