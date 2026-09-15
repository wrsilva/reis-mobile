---
name: flutter-widget-review
description: Reviews Flutter widget code for lifecycle bugs, BuildContext misuse across async gaps, missing dispose, side effects in build, unnecessary rebuilds, list and image performance, layout overflow risks and accessibility. Use when reviewing Dart files under lib/ that contain widgets, screens or pages, or when the user asks to review Flutter UI code.
intents: [review, performance]
stacks: [flutter]
---

# Flutter Widget Review

Aplique aos arquivos Dart com widgets (`StatelessWidget`, `StatefulWidget`, `ConsumerWidget`, `HookWidget`...). Os itens estão ordenados por impacto: os primeiros causam crash ou bug visível.

## 1. Ciclo de vida e async (crash / bug)

- [ ] **`BuildContext` depois de `await`.** Uso de `context` (`Navigator.of`, `ScaffoldMessenger.of`, `Theme.of`) após um `await` sem checar `if (!context.mounted) return;` (ou `mounted` num `State`). O lint `use_build_context_synchronously` cobre parte dos casos.
- [ ] **`setState` após `dispose`.** Callbacks de `Future`, `Stream` ou `Timer` que chamam `setState` sem checar `mounted`.
- [ ] **Recursos sem `dispose`.** `TextEditingController`, `AnimationController`, `ScrollController`, `PageController`, `FocusNode`, `StreamSubscription`, `Timer` e `ChangeNotifier` criados no `State` precisam ser liberados em `dispose()`.
- [ ] **Controller criado dentro de `build`.** Recria o controller a cada rebuild e perde o estado (texto digitado, posição do scroll).
- [ ] **`Future` criado dentro de `build`.** `FutureBuilder(future: api.fetch())` refaz a requisição a cada rebuild. O `Future` deve ser criado em `initState`, no state management ou memoizado.
- [ ] **Efeitos colaterais em `build`.** Navegação, `showDialog`, analytics ou chamadas de rede dentro de `build`. Devem ficar em listeners (`BlocListener`, `ref.listen`) ou em `addPostFrameCallback`.

## 2. Estado e identidade

- [ ] Itens de lista reordenáveis ou removíveis sem `Key` estável (`ValueKey(item.id)`): o estado vai parar no item errado.
- [ ] `GlobalKey` criada dentro de `build`.
- [ ] Estado de negócio guardado em `StatefulWidget` quando o projeto já usa um gerenciador de estado.

## 3. Performance de renderização

- [ ] Construtores `const` ausentes em subárvores estáticas (só reporte em widgets reconstruídos com frequência).
- [ ] Listas longas com `ListView(children: [...])` / `Column` dentro de `SingleChildScrollView`: use `ListView.builder` ou `SliverList`.
- [ ] `shrinkWrap: true` em lista grande dentro de outro scroll: força o layout de todos os itens.
- [ ] Escopo de rebuild grande demais: `setState`, `BlocBuilder` ou `Consumer` no topo da tela quando só um trecho muda. Use `buildWhen`, `select` ou extraia o widget.
- [ ] `MediaQuery.of(context)` usado só para o tamanho: `MediaQuery.sizeOf(context)` reconstrói menos. Confirme a versão do Flutter no `pubspec.lock` antes de sugerir.
- [ ] Imagens de rede sem `cacheWidth`/`cacheHeight` ou sem cache, decodificadas em resolução total para exibir miniaturas.
- [ ] `Opacity` animada ou `ClipRRect`/`BackdropFilter` em itens de lista: prefira `FadeTransition`/`AnimatedOpacity` e evite clip desnecessário.
- [ ] Trabalho pesado (parse de JSON grande, criptografia, processamento de imagem) na UI thread: use `compute`/`Isolate.run`.

## 4. Layout

- [ ] `Row` com `Text` sem `Expanded`/`Flexible`: overflow com texto longo ou fonte do sistema aumentada.
- [ ] Altura ou largura fixas para conteúdo de texto: quebram com `textScaler` alto.
- [ ] Ausência de `SafeArea` em telas sem `Scaffold`/`AppBar`.
- [ ] Teclado cobrindo campos: formulário fora de um scroll.

## 5. Acessibilidade e i18n

- [ ] `IconButton` e `GestureDetector` sem `tooltip` ou `Semantics(label: ...)`.
- [ ] Área de toque menor que 48x48 dp.
- [ ] Textos visíveis hardcoded quando o projeto já usa `intl`/`AppLocalizations`.
- [ ] Informação transmitida só por cor.

## Saída

Reporte na seção adequada do relatório (Bugs para a seção 1, Performance para a 3...), sempre com `arquivo:linha` e o trecho corrigido quando a correção for curta.
