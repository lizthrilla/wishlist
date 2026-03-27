import type { FormEvent } from 'react';
import type { FamilyInviteSummary, FamilySummary } from '../types/wishlist';
import UserSearchPanel from './UserSearchPanel';

interface FamiliesPanelProps {
  families: FamilySummary[];
  familyInvites: Record<number, FamilyInviteSummary[]>;
  latestInviteLinks: Record<number, string>;
  familyLoading: boolean;
  inviteAcceptanceLoading: boolean;
  inviteActionFamilyId: number | null;
  familyError: string | null;
  familyNotice: string | null;
  familyForm: { createName: string };
  onCreateFamilyFormChange: (value: string) => void;
  onCreateFamily: (event: FormEvent<HTMLFormElement>) => void;
  onCreateInvite: (familyId: number) => void;
  onRevokeInvite: (familyId: number, inviteId: number) => void;
  onAddMember?: (familyId: number, userId: number) => Promise<void>;
  addMemberLoading?: boolean;
  addMemberError?: string | null;
}

export default function FamiliesPanel({
  families,
  familyInvites,
  latestInviteLinks,
  familyLoading,
  inviteAcceptanceLoading,
  inviteActionFamilyId,
  familyError,
  familyNotice,
  familyForm,
  onCreateFamilyFormChange,
  onCreateFamily,
  onCreateInvite,
  onRevokeInvite,
  onAddMember,
  addMemberLoading = false,
  addMemberError = null,
}: FamiliesPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Your families</h2>
          <p className="subtle">
            Wishlist visibility is limited to people who share at least one family with you.
          </p>
        </div>
        {(familyLoading || inviteAcceptanceLoading) && <span className="pill">Refreshing</span>}
      </div>
      <div className="family-forms family-forms-single">
        <form className="stacked-form" onSubmit={onCreateFamily}>
          <label htmlFor="create-family-name">Create family</label>
          <input
            id="create-family-name"
            type="text"
            placeholder="Family name"
            value={familyForm.createName}
            onChange={(event) => onCreateFamilyFormChange(event.target.value)}
          />
          <button type="submit" className="primary-action">
            Create family
          </button>
        </form>
      </div>
      {familyError && <p className="form-error">{familyError}</p>}
      {familyNotice && <p className="form-notice">{familyNotice}</p>}
      {onAddMember && (
        <UserSearchPanel
          families={families}
          onAddMember={onAddMember}
          addMemberLoading={addMemberLoading}
          addMemberError={addMemberError}
        />
      )}
      <div className="family-list">
        {families.length === 0 ? (
          <div className="empty-state">
            <h3>No families yet</h3>
            <p>Create one to start sharing invite links with relatives.</p>
          </div>
        ) : (
          families.map((family) => (
            <article className="family-card" key={family.id}>
              <div className="family-card-header">
                <div>
                  <h3>{family.name}</h3>
                  <div className="family-card-meta">
                    <span className="pill">{family.memberCount} members</span>
                    <span className="role-pill">{family.currentUserRole}</span>
                  </div>
                </div>
              </div>
              <ul className="family-members">
                {family.members.map((member) => (
                  <li key={member.id}>
                    <strong>{member.name}</strong>
                    <span>{member.email}</span>
                  </li>
                ))}
              </ul>
              {family.currentUserRole === 'admin' && (
                <div className="invite-panel">
                  <div className="invite-panel-header">
                    <h4>Invite links</h4>
                    <button
                      className="secondary-action"
                      onClick={() => onCreateInvite(family.id)}
                    >
                      {inviteActionFamilyId === family.id ? 'Working...' : 'Create invite link'}
                    </button>
                  </div>
                  {latestInviteLinks[family.id] && (
                    <div className="invite-link-card">
                      <label htmlFor={`invite-link-${family.id}`}>Latest invite link</label>
                      <input
                        id={`invite-link-${family.id}`}
                        type="text"
                        readOnly
                        value={latestInviteLinks[family.id]}
                      />
                    </div>
                  )}
                  {(familyInvites[family.id] ?? []).length === 0 ? (
                    <p className="subtle">No active invites.</p>
                  ) : (
                    <ul className="invite-list">
                      {(familyInvites[family.id] ?? []).map((invite) => (
                        <li key={invite.id}>
                          <div>
                            <strong>
                              Expires {new Date(invite.expiresAt).toLocaleString()}
                            </strong>
                            <p className="subtle">Created by {invite.createdByUser.name}</p>
                          </div>
                          <button
                            className="secondary-action"
                            onClick={() => onRevokeInvite(family.id, invite.id)}
                          >
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
