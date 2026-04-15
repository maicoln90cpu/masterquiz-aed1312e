import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LayoutDashboard, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { pushGTMEvent } from "@/lib/gtmLogger";

export const PostExpressScreen = () => {
  const navigate = useNavigate();

  const handleCreateWithAI = () => {
    pushGTMEvent('post_express_choice', { choice: 'create_ai' });
    navigate('/create-quiz?ai=true');
  };

  const handleGoToDashboard = () => {
    pushGTMEvent('post_express_choice', { choice: 'dashboard' });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Rocket className="h-10 w-10 text-primary" />
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            ✨ Seu quiz de demonstração está no ar!
          </h1>
          <p className="text-muted-foreground text-lg">
            Agora crie seu quiz real para o seu negócio
          </p>
        </div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Button
            size="lg"
            className="w-full gap-2 text-base py-6"
            onClick={handleCreateWithAI}
          >
            <Sparkles className="h-5 w-5" />
            Criar meu quiz com IA
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 text-base py-6"
            onClick={handleGoToDashboard}
          >
            <LayoutDashboard className="h-5 w-5" />
            Ver meu dashboard
          </Button>
        </motion.div>

        {/* Subtle tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground"
        >
          O quiz de demonstração continuará ativo. Você pode editá-lo depois no painel.
        </motion.p>
      </motion.div>
    </div>
  );
};
