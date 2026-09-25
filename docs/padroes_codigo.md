# Padrões de Código e Guia de Desenvolvimento - Lumi App

## 1. Regras Gerais
- Todos os arquivos devem conter comentários claros e didáticos explicando finalidade, funções importantes, parâmetros e lógica crítica.
- Utilizar CSS Vanilla com variáveis CSS padronizadas em `src/styles/variables.css`.
- Manter componentes modulares e de responsabilidade única.

## 2. Padrão de Comentários em Componentes React
```javascript
// Componente de exemplo demonstrando o padrão de comentários
// Recebe propriedades para customização de visualização
function ExampleCard({ title, isActive }) {
  // Estado local para controle interno
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="example-card">
      {/* Título do Card */}
      <h3>{title}</h3>
    </div>
  );
}
```

## 3. Diretrizes de Responsividade
- Design adaptável para Mobile (320px - 480px), Tablet (481px - 1024px) e PC (1025px+).
- Uso de `clamp()` e unidades relativas (`rem`, `%`, `vh`, `vw`) para escalabilidade em telas diversas.
