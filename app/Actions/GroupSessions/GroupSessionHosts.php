<?php

namespace App\Actions\GroupSessions;

use App\Enums\GymLinkStatus;
use App\Models\GroupSession;
use App\Models\GroupSessionHost;
use App\Models\GymProfile;
use App\Models\TrainerProfile;
use App\Notifications\GroupSessionHostInvited;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The co-organizers of an event: the owner invites approved trainers and
 * gyms, up to GroupSession::MAX_HOSTS organizers in all; they say yes or no.
 * In a series, an invitation goes to this date and the next ones.
 */
class GroupSessionHosts
{
    public function __construct(private SaveGroupSession $save) {}

    public function invite(GroupSession $session, TrainerProfile|GymProfile $profile): void
    {
        $column = self::column($profile);

        if (! $profile->isApproved()) {
            throw ValidationException::withMessages(['host' => 'Puoi invitare solo profili approvati.']);
        }

        $session->loadMissing('hosts');

        if ($session->hosts->contains(fn (GroupSessionHost $host) => $host->{$column} === $profile->id && $host->status !== GymLinkStatus::Declined)) {
            throw ValidationException::withMessages(['host' => 'È già tra gli organizzatori o ha già un invito.']);
        }

        if ($session->hosts->where('status', '!=', GymLinkStatus::Declined)->count() >= GroupSession::MAX_HOSTS) {
            throw ValidationException::withMessages(['host' => 'Un evento può avere al massimo '.GroupSession::MAX_HOSTS.' organizzatori.']);
        }

        $owner = $session->owner();

        DB::transaction(function () use ($session, $profile, $column) {
            foreach ($this->save->affected($session, SaveGroupSession::SCOPE_FOLLOWING) as $item) {
                $item->hosts()->updateOrCreate(
                    [$column => $profile->id],
                    ['is_owner' => false, 'status' => GymLinkStatus::Pending, 'responded_at' => null],
                );
            }
        });

        $profile->user->notify(new GroupSessionHostInvited(
            $session,
            $owner?->name() ?? 'Un organizzatore',
            $profile instanceof TrainerProfile ? 'trainer.events' : 'gym.events',
        ));
    }

    /** Yes or no to the invitation, for every date of the series that has it. */
    public function answer(GroupSessionHost $host, bool $accept): void
    {
        $column = $host->trainer_profile_id !== null ? 'trainer_profile_id' : 'gym_profile_id';

        $this->seriesRows($host)
            ->where($column, $host->{$column})
            ->where('status', GymLinkStatus::Pending)
            ->update([
                'status' => $accept ? GymLinkStatus::Accepted : GymLinkStatus::Declined,
                'responded_at' => now(),
            ]);
    }

    /** The owner takes a co-organizer off, or a co-organizer leaves: this date and the next ones. */
    public function remove(GroupSessionHost $host): void
    {
        if ($host->is_owner) {
            throw ValidationException::withMessages(['host' => 'Chi ha creato l’evento non può uscire: annullalo, se serve.']);
        }

        $column = $host->trainer_profile_id !== null ? 'trainer_profile_id' : 'gym_profile_id';

        $this->seriesRows($host)->where($column, $host->{$column})->where('is_owner', false)->delete();
    }

    /**
     * @return Builder<GroupSessionHost>
     */
    private function seriesRows(GroupSessionHost $host): Builder
    {
        $ids = $this->save->affected($host->groupSession, SaveGroupSession::SCOPE_FOLLOWING)->pluck('id');

        return GroupSessionHost::query()->whereIn('group_session_id', $ids->push($host->group_session_id)->unique());
    }

    private static function column(TrainerProfile|GymProfile $profile): string
    {
        return $profile instanceof TrainerProfile ? 'trainer_profile_id' : 'gym_profile_id';
    }
}
