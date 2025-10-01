import { ArrowLeft } from "lucide-react";
import { UnstyledButton } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import './backButton.css';

interface BackButton {
    to: string;
}

export default function Back({ to }: BackButton) {
    const buttonPath = to || '/';

    return (
        <UnstyledButton
        to={buttonPath}
        className="backButton"
        component={Link}
        >
            <ArrowLeft size={24} />
        </UnstyledButton>
    )
}