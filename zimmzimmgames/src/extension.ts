import * as vscode from 'vscode';
import * as ollama from 'ollama';

export function activate(context: vscode.ExtensionContext) {
    
	const whiteRabbitButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    whiteRabbitButton.text = "$(comment-discussion) DeepSeek Chat"; // Icono y texto
    whiteRabbitButton.command = 'zimmzimmgames.helloWorld'; // Comando a ejecutar
    whiteRabbitButton.show();

    context.subscriptions.push(whiteRabbitButton);
	
	const disposable = vscode.commands.registerCommand('zimmzimmgames.helloWorld', () => {
        const panel = vscode.window.createWebviewPanel(
            'whiteChat', // Consistent naming (lowercase 'w')
            'Deep Seek Chat', // Title case
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(async (message: any) => {
            if (message.command === 'ask') {
                const userPrompt = message.text;
                panel.webview.postMessage({ command: 'ollamachatResponse', text: '...' }); // Processing indicator

                try {
                    const streamResponse = await ollama.default.chat({
                        model: 'deepseek-r1:14b',
                        messages: [{ role: 'user', content: userPrompt }],
                        stream: true,
                    });

                    let responseText = '';
                    for await (const part of streamResponse) {
                        responseText += part.message.content;
                        panel.webview.postMessage({ command: 'ollamachatResponse', text: part.message.content }); // Stream each part
                    }

                    // No need to post the complete response again after the loop
                } catch (err) {
                    panel.webview.postMessage({ command: 'ollamachatResponse', text: `Error: ${String(err)}` });
                }
            }
        });
    });

    context.subscriptions.push(disposable);
    //     console.log('Hello World!');

    //     const disponsable = vscode.commands.registerCommand('zimmzimmgames.helloWorld', () => {
        
    //     vscode.window.showErrorMessage('Hi!, how are you');
    //    });
    //    context.subscriptions.push(disponsable);
}

function getWebviewContent(): string {
    return /*html*/ `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Deep Seek Chat</title> <!- Add title for better accessibility ->
        <style>
            body { font-family: Arial, sans-serif; margin: 1rem; }
            #prompt { width: 100%; box-sizing: border-box; }
            #response { border: 1px solid #ccc; padding: 1rem; margin-top: 1rem; overflow-y: auto; min-height: 100px; } /* Improve response area */
        </style>
    </head>
    <body>
        <h2>Deep Seek Chat</h2>
        <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea><br/>
        <button id="askBtn">Ask</button>
        <div id="response"></div>

        <script>
            const vscode = acquireVsCodeApi();
            const askBtn = document.getElementById('askBtn');
            const promptTextarea = document.getElementById('prompt');
            const responseDiv = document.getElementById('response');

            askBtn.addEventListener('click', () => {
                const prompt = promptTextarea.value;

                if (prompt.trim() !== "") {  // Check if prompt is not empty
                    vscode.postMessage({ command: 'ask', text: prompt });
                    responseDiv.innerText = '...'; // Initial processing indicator
                    promptTextarea.value = ''; // Clear input field after sending
                }

            });

            window.addEventListener('message', event => {
                const { command, text } = event.data;
                if (command === 'ollamachatResponse') {
                    if (text === '...') {
                        responseDiv.innerText = text; // Show initial processing dots

                    }
                    else{
                        responseDiv.innerText += text;  // Append streamed response

                    }
                    responseDiv.scrollTop = responseDiv.scrollHeight; // Scroll to bottom

                }

            });
        </script>
    </body>
    </html>`;
}


export function deactivate() {}

