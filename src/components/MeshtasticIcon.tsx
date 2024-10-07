export interface MeshtasticIconProps {
    className?: string;
}

export default function MeshtasticIcon(props: MeshtasticIconProps) {
    const { className } = props;
    return (
        <span className="p-2">
            <img alt="" src="https://meshtastic.org/design/logo/svg/Mesh_Logo_White.svg" className={className} />
        </span>
    )
}