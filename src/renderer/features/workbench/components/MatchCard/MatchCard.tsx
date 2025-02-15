import React from 'react';
import CheckIcon from '@material-ui/icons/Check';
import BanIcon from '@material-ui/icons/NotInterested';
import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import RestoreOutlined from '@material-ui/icons/RestoreOutlined';
import DescriptionOutlined from '@material-ui/icons/DescriptionOutlined';
import Label from '../Label/Label';

export enum MATCH_CARD_ACTIONS {
  ACTION_ENTER,
  ACTION_IDENTIFY,
  ACTION_IGNORE,
  ACTION_RESTORE,
  ACTION_DETACH,
  ACTION_DETAIL,
}

interface MatchCardProps {
  label: string | null;
  status: string | null;
  type: string | null;
  onAction: (action: number) => void;
}

const MatchCard = ({ label, status, onAction, type }: MatchCardProps) => {
  const [isShow, setIsShow] = React.useState(false);

  return (
    <div
      onMouseOver={() => setIsShow(true)}
      onFocus={() => setIsShow(true)}
      className={`match-card status-${status?.toLowerCase()}`}
    >
      <div className="match-card-content">
        <div onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_ENTER)} className="label-div">
          <Label label={label} textColor="black" />
        </div>
        <div className="match-card-buttons">
          {status === 'pending' && isShow && (
            <>
              <span className="type">{type}</span>
              <Tooltip title="Identify">
                <IconButton size="small" onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_IDENTIFY)}>
                  <CheckIcon className="icon check" fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Mark as original">
                <IconButton size="small" onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_IGNORE)}>
                  <BanIcon className="icon ban" fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {status === 'ignored' && isShow && (
            <>
              <Tooltip title="Restore">
                <IconButton size="small" onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_RESTORE)}>
                  <RestoreOutlined className="icon" fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {status === 'identified' && isShow && (
            <>
              <Tooltip title="Remove identification">
                <IconButton size="small" onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_DETACH)}>
                  <RestoreOutlined className="icon" fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View identification">
                <IconButton size="small" onClick={() => onAction(MATCH_CARD_ACTIONS.ACTION_DETAIL)}>
                  <DescriptionOutlined fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
