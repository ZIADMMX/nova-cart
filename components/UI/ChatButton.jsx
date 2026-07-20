'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export default function FloatingChatButton() {
    const pathname = usePathname();
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    if (pathname.startsWith('/auth')) return null;

    const handleClick = () => {
        router.push('/chat');
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
            aria-label="Open Chat"
        >
            <MessageCircle className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
        </button>
    );
}
