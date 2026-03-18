'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Building2, CreditCard, Hash, FileText, Shield } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

type Settings = {
  companyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  siret: string
  iban: string
  bic: string
  bankName: string
  quotePrefix: string
  invoicePrefix: string
  depositPrefix: string
  legalMention: string
  paymentTermsDays: number
}

const defaultSettings: Settings = {
  companyName: 'Webinti', ownerName: '', email: '', phone: '', address: '', siret: '',
  iban: '', bic: '', bankName: '',
  quotePrefix: 'DEV', invoicePrefix: 'FAC', depositPrefix: 'ACP',
  legalMention: 'TVA non applicable, art. 293 B du CGI',
  paymentTermsDays: 30,
}

export default function ParametresPage() {
  const [form, setForm] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(data => {
      setForm({ ...defaultSettings, ...data })
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, paymentTermsDays: Number(form.paymentTermsDays) }),
    })
    if (res.ok) toast.success('Paramètres enregistrés')
    else {
      const err = await res.json().catch(() => ({}))
      console.error('Settings error:', err)
      toast.error('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const f = (key: keyof Settings) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  })

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Paramètres" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-[#475569]">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Paramètres" subtitle="Configuration de votre CRM" />

      <div className="flex-1 p-3 sm:p-6">
        <form onSubmit={handleSave} className="max-w-2xl mx-auto space-y-5">
          {/* Identité */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 size={15} style={{ color: '#7ee5aa' }} />
                  Identité
                </CardTitle>
                <CardDescription>Informations affichées sur vos documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Nom de l'entreprise" {...f('companyName')} placeholder="Webinti" />
                  <Input label="Votre nom complet" {...f('ownerName')} placeholder="Jean Dupont" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Email professionnel" type="email" {...f('email')} placeholder="contact@webinti.com" />
                  <PhoneInput
                    label="Téléphone"
                    value={form.phone}
                    onChange={v => setForm({ ...form, phone: v })}
                  />
                </div>
                <Textarea label="Adresse" {...f('address')} placeholder="12 rue de la Paix, 75001 Paris" rows={2} />
                <Input label="SIRET" {...f('siret')} placeholder="12345678901234" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Coordonnées bancaires */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard size={15} style={{ color: '#7ee5aa' }} />
                  Coordonnées bancaires
                </CardTitle>
                <CardDescription>Affichées sur vos factures pour le paiement par virement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label="Nom de la banque" {...f('bankName')} placeholder="CIC, BNP, Crédit Agricole..." />
                <Input label="IBAN" {...f('iban')} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" className="font-mono" />
                <Input label="BIC / SWIFT" {...f('bic')} placeholder="XXXXXXXX" className="font-mono" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Numérotation */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash size={15} style={{ color: '#7ee5aa' }} />
                  Numérotation
                </CardTitle>
                <CardDescription>Préfixes des numéros de documents (ex: DEV-2025-0001)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Préfixe devis" {...f('quotePrefix')} placeholder="DEV" />
                <Input label="Préfixe facture" {...f('invoicePrefix')} placeholder="FAC" />
                <Input label="Préfixe acompte" {...f('depositPrefix')} placeholder="ACP" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Mentions légales */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={15} style={{ color: '#7ee5aa' }} />
                  Mentions légales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Mention TVA (pied de page)"
                  {...f('legalMention')}
                  placeholder="TVA non applicable, art. 293 B du CGI"
                  rows={2}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#94a3b8] uppercase tracking-wider">Délai de paiement (jours)</label>
                  <input
                    type="number"
                    value={form.paymentTermsDays}
                    onChange={e => setForm({ ...form, paymentTermsDays: parseInt(e.target.value) || 30 })}
                    min="0" max="90"
                    style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #252538', background: '#0d0d14', fontSize: 13, color: '#f0f0ff', outline: 'none', fontFamily: 'inherit', width: 128 }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* RGPD Notice */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)' }}>
              <Shield size={16} style={{ color: '#7ee5aa', marginTop: 2, flexShrink: 0 }} />
              <div>
                <p className="text-sm font-medium text-[#818cf8]">Conformité RGPD</p>
                <p className="text-xs text-[#64748b] mt-1">
                  Vos données sont hébergées sur Neon (AWS eu-central-1, Francfort, UE).
                  Les données clients ne sont pas partagées avec des tiers.
                  Usage exclusivement interne.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-end pb-6">
            <Button type="submit" loading={saving} size="lg">
              <Save size={15} />
              Enregistrer les paramètres
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
