/**
 * 🛡️ P29 — Contract test: componentes base de estado têm ARIA correto
 *
 * Garante que EmptyState, ErrorState, PageLoading, Callout e FormFieldA11y
 * NUNCA percam seus papéis ARIA / atributos de acessibilidade. Qualquer refactor
 * que remova `role="alert"`, `role="status"`, `aria-invalid` ou `aria-describedby`
 * quebra este teste.
 *
 * Pareado com Onda 8.7/8.8 — ver mem://design/responsive-system.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-loading";
import { Callout } from "@/components/ui/callout";
import { FormFieldA11y } from "@/components/ui/form-field-a11y";
import { Inbox } from "lucide-react";

describe("P29 — Contract: componentes base de estado mantêm ARIA", () => {
  it("ErrorState SEMPRE expõe role=alert", () => {
    render(<ErrorState title="X" message="Y" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("EmptyState NÃO grita como alerta (não é erro)", () => {
    render(<EmptyState icon={Inbox} title="Vazio" description="Sem dados" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("PageLoading expõe role=status para anunciar carregamento", () => {
    render(<PageLoading variant="spinner" />);
    // page-loading usa role=status no spinner principal
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  it("Callout variant=warning expõe role=alert (alta urgência)", () => {
    render(<Callout variant="warning">Cuidado</Callout>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("Callout variant=destructive expõe role=alert", () => {
    render(<Callout variant="destructive">Erro fatal</Callout>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("Callout variant=info expõe role=status (não é alerta)", () => {
    render(<Callout variant="info">Apenas FYI</Callout>);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  describe("FormFieldA11y", () => {
    it("conecta label ao input via htmlFor + id", () => {
      render(
        <FormFieldA11y label="Email">
          {(p) => <input type="email" {...p} />}
        </FormFieldA11y>,
      );
      const input = screen.getByLabelText("Email") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.id).toBeTruthy();
    });

    it("aplica aria-invalid + role=alert na mensagem de erro", () => {
      render(
        <FormFieldA11y label="Senha" error="Muito curta">
          {(p) => <input type="password" {...p} />}
        </FormFieldA11y>,
      );
      const input = screen.getByLabelText("Senha");
      expect(input).toHaveAttribute("aria-invalid", "true");
      const err = screen.getByRole("alert");
      expect(err).toHaveTextContent("Muito curta");
      expect(input.getAttribute("aria-describedby")).toContain(err.id);
    });

    it("aplica aria-required + asterisco visual quando required", () => {
      render(
        <FormFieldA11y label="Nome" required>
          {(p) => <input {...p} />}
        </FormFieldA11y>,
      );
      const input = screen.getByLabelText(/nome/i);
      expect(input).toHaveAttribute("aria-required", "true");
      expect(input).toBeRequired();
    });

    it("conecta hint via aria-describedby quando NÃO há erro", () => {
      render(
        <FormFieldA11y label="Email" hint="Nunca compartilhamos">
          {(p) => <input type="email" {...p} />}
        </FormFieldA11y>,
      );
      const input = screen.getByLabelText("Email");
      const hint = screen.getByText("Nunca compartilhamos");
      expect(input.getAttribute("aria-describedby")).toContain(hint.id);
    });
  });
});