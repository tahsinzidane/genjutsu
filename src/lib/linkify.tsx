import React from "react";
import { Link } from "react-router-dom";

const urlRegex = /(https?:\/\/[^\s]+)/g;
const mentionRegex = /(@[a-zA-Z0-9_]+)/g;

export function linkify(text: string) {
    if (!text) return text;

    // First, split by URL
    return text.split(urlRegex).map((part, i) => {
        if (urlRegex.test(part)) {
            const trailingPunctuationMatch = part.match(/[.,!?:;]+$/);
            const url = trailingPunctuationMatch ? part.slice(0, -trailingPunctuationMatch[0].length) : part;
            const punctuation = trailingPunctuationMatch ? trailingPunctuationMatch[0] : "";

            return (
                <React.Fragment key={`url-${i}`}>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline hover:text-blue-400 transition-colors break-all"
                    >
                        {url}
                    </a>
                    {punctuation}
                </React.Fragment>
            );
        }

        // Then, split by mentions for non-URL parts
        return part.split(mentionRegex).map((subPart, j) => {
            if (mentionRegex.test(subPart)) {
                const username = subPart.slice(1);
                return (
                    <Link
                        key={`mention-${i}-${j}`}
                        to={`/${username}`}
                        className="text-primary font-bold hover:underline"
                    >
                        {subPart}
                    </Link>
                );
            }
            return subPart;
        });
    });
}