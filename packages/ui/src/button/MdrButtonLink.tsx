import React from 'react';
import { type To } from 'react-router';
import MdrButton, { type MdrButtonProps } from './MdrButton';
import MdrLink from '../link/MdrLink';

type ButtonLinkProps = MdrButtonProps & {
    to: To;
    replace?: boolean;
    state?: any;
} & React.RefAttributes<HTMLAnchorElement>;

function MdrButtonLink(props: ButtonLinkProps) {
    return <MdrLink to={props.to} disabled={props.disabled} >
        <MdrButton {...props} />
    </MdrLink>
}

export default MdrButtonLink