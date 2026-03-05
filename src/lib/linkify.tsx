import React from "react";

const urlRegex = /(https?:\/\/[^\s]+)/g;

export function linkify(text: string) {
    if (!text) return text;

    return text.split(urlRegex).map((part, i) => {
        if (urlRegex.test(part)) {
            // Logic to handle trailing punctuation (.,!?:;)
            const trailingPunctuationMatch = part.match(/[.,!?:;]+$/);
            const url = trailingPunctuationMatch ? part.slice(0, -trailingPunctuationMatch[0].length) : part;
            const punctuation = trailingPunctuationMatch ? trailingPunctuationMatch[0] : "";

            return (
                <React.Fragment key={i}>
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
        return part;
    });
}