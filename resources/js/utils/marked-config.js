import { marked } from 'marked';

marked.setOptions({
    gfm: true,
    breaks: true,
    sanitize: true
});

export { marked }; 