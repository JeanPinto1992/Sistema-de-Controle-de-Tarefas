# Componentes de Estilo

Os componentes exportados de `src/styles` utilizam variáveis de tema para manter consistência visual em todo o sistema.

## Uso

```jsx
import { Button, Card, Input, Title, Form, FormGroup } from '../styles';
```

### Button

- `variant` – controla a cor de fundo usando `var(--primary)` ou `var(--secondary)`.

```jsx
<Button variant="primary">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
```

### Card

```jsx
<Card>Conteúdo aqui</Card>
```

### Input

Aceita a prop `as` (`input`, `textarea` ou `select`).

```jsx
<Input placeholder="Nome" />
<Input as="textarea" />
<Input as="select">
  <option>Opção</option>
</Input>
```

### Title

Define o nível da tag (`h1` a `h6`) via `level`.

```jsx
<Title level={2}>Seção</Title>
```

### Form e FormGroup

```jsx
<Form>
  <FormGroup>
    <Input placeholder="Campo" />
  </FormGroup>
</Form>
```

Todos os componentes aplicam automaticamente `color: var(--text-primary)`, `padding: var(--spacing-sm)` e bordas baseadas no tema.
