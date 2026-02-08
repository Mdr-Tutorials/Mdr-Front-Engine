import React from 'react';
import { type To } from 'react-router';
import MdrButton, { type MdrButtonProps } from './MdrButton';
import MdrLink from '../link/MdrLink';

export interface MdrButtonLinkSpecificProps
    extends MdrButtonProps,
        React.RefAttributes<HTMLAnchorElement> {
    to: To;
    replace?: boolean;
    state?: any;
}

function MdrButtonLink(props: MdrButtonLinkSpecificProps) {
    return (
        <MdrLink
            className="MdrButtonLink"
            to={props.to}
            disabled={props.disabled}
        >
            <MdrButton {...props} />
        </MdrLink>
    );
}

export default MdrButtonLink;
