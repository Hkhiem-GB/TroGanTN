"use client";

import { useState } from 'react';
import ChatWidget from './ChatWidget';

export default function GlobalChat() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ChatWidget
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            landlordName="Cô Lan (Hỗ trợ 24/7)"
            avatar="https://api.dicebear.com/7.x/notionists/svg?seed=Lan"
        />
    );
}