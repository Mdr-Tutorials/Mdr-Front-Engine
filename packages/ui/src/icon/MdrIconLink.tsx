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
    const { to, title, ...iconProps } = props;
    return <MdrLink className="MdrIconLink" to={to} title={title} >
        <MdrIcon {...iconProps} title={title} />
    </MdrLink>;
}

export default MdrIconLink;
