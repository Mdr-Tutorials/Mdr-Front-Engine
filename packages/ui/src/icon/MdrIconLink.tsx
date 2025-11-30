import React from 'react';
import { type To } from 'react-router';
import MdrIcon, { type MdrIconProps } from '../icon/MdrIcon';
import MdrLink from '../link/MdrLink';
import './MdrIconLink.scss';


export interface MdrIconLinkSpecificProps extends MdrIconProps, React.RefAttributes<HTMLAnchorElement> {
    to: To;
    replace?: boolean;
    state?: any;

}

function MdrIconLink(props: MdrIconLinkSpecificProps) {
    return <MdrLink className="MdrIconLink" to={props.to} >
        <MdrIcon {...props} />
    </MdrLink>
}

export default MdrIconLink