# DJ Pad Studio

Mesa de sons em português com 25 pads, atalhos de teclado, reprodução simultânea, loop, velocidade, graves e volume individual. Feita com Next.js, React, TypeScript e Web Audio API.

## Rodar localmente

Use Node.js 22 ou superior:

```sh
npm ci
npm run dev
```

Abra <http://localhost:9002>. No PowerShell com execução de scripts bloqueada, use `npm.cmd` no lugar de `npm`.

## Como usar

- Clique em um pad ou pressione a tecla indicada. Um novo toque reinicia um sample; se estiver em loop, para a reprodução.
- Ative **Modo edição** para selecionar sem tocar. Os atalhos de teclado continuam disponíveis para tocar.
- Selecione um pad vazio e clique em **Importar meu som**, ou substitua um som existente. São aceitos arquivos de áudio de até 20 MB e 2 minutos, nos formatos que o navegador conseguir decodificar.
- Ajuste nome, cor, velocidade, graves, loop e volume no painel lateral.
- Use **Esc**, apóstrofo (`'`) ou **Parar tudo** para interromper inclusive sons ainda carregando.
- **Restaurar este pad** pede confirmação e remove sua importação e seus ajustes daquele pad.

Configurações ficam no `localStorage`; arquivos importados ficam no IndexedDB. Nenhum áudio importado é enviado para um servidor. Limpar os dados do site remove a biblioteca. Se o navegador bloquear armazenamento ou ficar sem espaço, o app informa que a importação vale só para a sessão. O desbloqueio do áudio exige uma interação do usuário, conforme as regras do navegador.

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes de áudio verificam cache, interrupção durante carregamento, limpeza dos nós, reprodução simultânea e atualização dos controles. Os testes de navegador cobrem desktop e celular, teclado, edição, importação, persistência, restauração e falhas de carregamento.

## Publicação

Para hospedagens com suporte a Next.js, use `npm run build` e `npm start`. Para exportar HTML estático, defina `GITHUB_PAGES=true` antes do build; o resultado fica em `out/`. Se a hospedagem usar uma subpasta, defina também `NEXT_PUBLIC_BASE_PATH=/nome-da-subpasta` **durante o build**, sem barra no final. O mesmo prefixo é aplicado aos arquivos de som.

O workflow existente em `.github/workflows/deploy.yml` usa o caminho fornecido pelo GitHub Pages, instala com `npm ci`, exporta e verifica o código antes de publicar. As mudanças locais não publicam o site; o workflow é acionado por push em `main` ou manualmente no GitHub.

## Revisão técnica

- Corrigidas referências a 18 arquivos de áudio inexistentes: agora esses pads são espaços vazios para importação.
- Todos os 25 pads têm teclas únicas. Atalhos respeitam campos de texto, sliders, modificadores e composição de texto.
- Efeitos de áudio saíram das funções de atualização de estado do React. O indicador ativo acompanha `AudioBufferSourceNode.onended`, inclusive com alterações de velocidade.
- Cada pad mantém uma voz; repetir um sample reinicia essa voz. Pads diferentes podem tocar juntos. Parar cancela pedidos pendentes e desconecta os nós.
- Adicionados cache de downloads/decodificação e compressor na saída. A velocidade também altera o tom; não há time stretching.
- Recuperação de configurações inválidas, feedback de falhas, nomes acessíveis, foco visível, interface em português e suporte a movimento reduzido.
- Removidas dependências de IA/Firebase sem uso e comandos que apontavam para os arquivos de IA já removidos no workspace.
- Build compatível com Windows, ESLint executável e TypeScript obrigatório no build.
- Next.js atualizado para 15.5.28, conforme a [atualização oficial de segurança de 14/10/2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026); React atualizado dentro da série 19.2.
- PostCSS atualizado e unificado via `overrides` para evitar a versão transitiva vulnerável do Next.js. Dependências de compilação foram mantidas em `devDependencies`.

Em 17/10/2026, `npm audit --omit=dev` não encontrou vulnerabilidades. A auditoria completa ainda aponta **9 alertas de desenvolvimento** (7 altos e 2 moderados), nas cadeias de Tailwind 3/ESLint: `braces` e `postcss-selector-parser`. O [alerta de braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) não tem versão corrigida publicada; o [parser de seletores](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) exige atualização fora da versão usada pelo Tailwind 3. Esses pacotes processam os padrões e estilos do repositório durante desenvolvimento/compilação. O app não encaminha áudio, nomes ou arquivos dos usuários para esses parsers. Não foi aplicado `npm audit fix --force`, que migraria ferramentas para versões principais incompatíveis. Os alertas devem ser acompanhados na manutenção.

Antes de distribuir os samples incluídos comercialmente, confirme a origem e as permissões de cada gravação. Esta revisão não verificou licenças desses áudios. A persistência é local, sem sincronização entre dispositivos. Safari/iOS em aparelho físico e comportamento com fones Bluetooth ainda devem ser verificados antes de um lançamento amplo.
