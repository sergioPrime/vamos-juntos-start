import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Mail, Lock } from "lucide-react"

export default function Auth() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        })
      } else if (data.user) {
        toast({
          title: "Login realizado",
          description: "Bem-vindo de volta!",
        })
        navigate("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    try {
      // Call edge function to create user with confirmed email
      const { data: createUserData, error: createUserError } = await supabase.functions.invoke('create-user', {
        body: { email, password }
      })

      if (createUserError || createUserData?.error) {
        // Se o usuário já existir, tentamos fazer login automaticamente
        const { data: signInTry, error: signInTryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInTry?.user && signInTry?.session && !signInTryError) {
          toast({
            title: "Login realizado",
            description: "Bem-vindo de volta!",
          })
          navigate("/dashboard")
          return
        }

        const friendly =
          (createUserData?.error as string) ||
          (signInTryError?.message?.toLowerCase().includes("invalid login credentials")
            ? "E-mail já cadastrado. Entre com sua senha ou recupere o acesso."
            : createUserError?.message) ||
          "Erro ao criar usuário"

        toast({
          title: "Erro no cadastro",
          description: friendly,
          variant: "destructive",
        })
        return
      }

      // Now sign in the user immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        toast({
          title: "Erro no login",
          description: "Usuário criado, mas erro ao fazer login automático: " + signInError.message,
          variant: "destructive",
        })
        return
      }

      if (signInData.user && signInData.session) {
        toast({
          title: "Cadastro realizado",
          description: "Bem-vindo ao sistema!",
        })
        navigate("/dashboard")
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/61604d4b-329d-45cb-b4f7-386f93edfb14.png" alt="Prime ERP" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Prime ERP</CardTitle>
          <CardDescription>
            Entre na sua conta ou crie uma nova para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleSignIn}
                disabled={loading || !email || !password}
                className="w-full"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleSignUp}
                disabled={loading || !email || !password}
                className="w-full"
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}