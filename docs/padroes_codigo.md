# Padrões de Código e Guia de Desenvolvimento - Lumi App

## 1. Regras Gerais
- Todos os arquivos devem conter comentários claros e didáticos explicando finalidade, funções importantes, parâmetros e lógica crítica.
- Utilizar CSS Vanilla com variáveis CSS padronizadas em `src/styles/variables.css`.
- Manter componentes modulares e com separação clara entre camada visual e camada de serviços (`src/services/`).
- Não alterar arquivos automaticamente sem permissão explícita (**PODE ALTERAR**).

---

## 2. Padrão de Comentários em Componentes React
Sempre utilizar comentários acima dos blocos principais e documentação JSDoc nas funções:

```javascript
// Componente responsável por exibir e copiar figurinhas estilizadas
// @param {Object} props - Propriedades do componente
// @param {string} props.theme - Tema ativo ('dark' ou 'light')
// @param {Function} props.onSelectCategory - Callback ao selecionar uma categoria
export function ExampleCard({ theme, onSelectCategory }) {
  // Estado local para controlar o carregamento do card
  const [isLoading, setIsLoading] = useState(false);

  // Manipulador de clique com feedback tátil
  const handleClick = () => {
    setIsLoading(true);
    if (onSelectCategory) onSelectCategory();
  };

  return (
    <div className="example-card">
      {/* Título do Card */}
      <h3>Exemplo de Card</h3>
    </div>
  );
}
```

---

## 3. Diretrizes de Segurança & Autenticação
- **Validação de Senha Forte**: No cadastro, exigir no mínimo 8 caracteres contendo letras, números e caracteres especiais (`[!@#$%^&*...]`) com feedback visual dinâmico.
- **Validação de Sessão**: Ao inicializar o app, validar a autenticidade do token JWT com o Supabase através de `validateSession()`.
- **Proteção de Banco**: Toda nova tabela criada no Supabase deve possuir **Row Level Security (RLS)** habilitado e políticas estritas.

---

## 4. Diretrizes de Performance & Imagens
- Todas as tags `<img>` principais devem conter atributos explícitos `width` e `height` para evitar Cumulative Layout Shift (CLS).
- Utilizar `loading="lazy"` para itens fora da primeira dobra e `decoding="async"` para imagens secundárias.
- Manter o Code Splitting com `React.lazy` e `Suspense` em rotas secundárias no `App.jsx`.

---

## 5. Diretriz de Ícones e Elementos Visuais
- **Nunca utilizar emojis de texto** na interface do usuário (ex: 📲, ✨, 🔥, 🎨, ⭐, 👑).
- Sempre utilizar **ícones vetoriais SVG** padronizados para manter a estética iOS elegante e profissional.
