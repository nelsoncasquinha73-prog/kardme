"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ColorPickerProvider } from "@/components/editor/ColorPickerContext";
import ColorPickerPro from "@/components/editor/ColorPickerPro";
import FontPicker from "@/components/editor/FontPicker";
import { useColorPicker } from "@/components/editor/ColorPickerContext";
import { Ambassador } from "@/lib/ambassadors/ambassadorService";

type AmbassadorEditModalProps = {
  ambassador: Ambassador | null;
  onClose: () => void;
  onSave: (ambassador: Ambassador) => void;
};

function AmbassadorEditModalContent({
  ambassador,
  onClose,
  onSave,
}: AmbassadorEditModalProps) {
  const [formData, setFormData] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [showAddField, setShowAddField] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { openPicker } = useColorPicker();

  useEffect(() => {
    if (ambassador) {
      setFormData({ ...ambassador });
    }
  }, [ambassador]);

  if (!formData) return null;

  const canPublish =
    formData.subscription_status === "active" &&
    formData.is_active === true &&
    (!formData.subscription_current_period_end ||
      new Date(formData.subscription_current_period_end) > new Date());

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Apenas JPG, PNG e WebP são permitidos");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem deve ter menos de 5MB");
      return;
    }

    const isAvatar = type === "avatar";
    if (isAvatar) setUploadingAvatar(true);
    else setUploadingCover(true);

    try {
      const fileName = `${formData.id}/${type}-${Date.now()}.${file.name.split(".").pop()}`;
      const bucketName = "ambassadors";

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Gerar URL pública
      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const imageUrl = publicData.publicUrl;

      // Atualizar formData
      if (isAvatar) {
        setFormData({ ...formData, avatar_url: imageUrl });
      } else {
        setFormData({ ...formData, cover_url: imageUrl });
      }

      alert(`${type === "avatar" ? "Avatar" : "Capa"} carregado com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      alert(`Erro ao carregar ${type === "avatar" ? "avatar" : "capa"}: ${error.message}`);
    } finally {
      if (isAvatar) setUploadingAvatar(false);
      else setUploadingCover(false);
      // Limpar input
      if (isAvatar && avatarInputRef.current) avatarInputRef.current.value = "";
      else if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("ambassadors")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          cover_url: formData.cover_url,
          slug: formData.slug,
          default_fields: formData.default_fields,
          custom_fields: formData.custom_fields,
          background_color: formData.background_color,
          text_color: formData.text_color,
          font_family: formData.font_family,
        })
        .eq("id", formData.id);

      if (error) throw error;
      onSave(formData);
      alert("Embaixador guardado!");
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    setPublishLoading(true);
    try {
      const { error } = await supabase
        .from("ambassadors")
        .update({ is_published: !formData.is_published })
        .eq("id", formData.id);

      if (error) throw error;
      setFormData({ ...formData, is_published: !formData.is_published });
    } catch (e: any) {
      alert("Erro: " + e?.message);
    }
    setPublishLoading(false);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    const newField = {
      id: Math.random().toString(36).substr(2, 9),
      label: newFieldLabel,
      type: newFieldType as "text" | "textarea" | "select",
      options: [],
      required: false,
      enabled: true,
    };
    setFormData({
      ...formData,
      custom_fields: [...formData.custom_fields, newField],
    });
    setNewFieldLabel("");
    setNewFieldType("text");
    setShowAddField(false);
  };

  const removeCustomField = (id: string) => {
    setFormData({
      ...formData,
      custom_fields: formData.custom_fields.filter((f) => f.id !== id),
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: 12,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 8,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: 16,
          padding: 32,
          maxWidth: 700,
          maxHeight: "90vh",
          overflow: "auto",
          width: "90%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
            Editar Embaixador
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 24,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            📋 Dados Pessoais
          </h3>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Telefone</label>
            <input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              style={{
                ...inputStyle,
                minHeight: 80,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            🖼️ Imagens
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Avatar</label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {formData.avatar_url ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid rgba(59,130,246,0.3)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: undefined })}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.9)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    border: "2px dashed rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  Sem imagem
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageUpload(e, "avatar")}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(59,130,246,0.35)",
                    background: "rgba(59,130,246,0.12)",
                    color: "#93c5fd",
                    cursor: uploadingAvatar ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 8,
                    opacity: uploadingAvatar ? 0.6 : 1,
                  }}
                >
                  {uploadingAvatar ? "⏳ A carregar..." : "📤 Carregar Avatar"}
                </button>
                <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                  JPG, PNG. Máx 5MB. Será cortado em círculo.
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Foto de Capa</label>
            <div style={{ marginBottom: 12 }}>
              {formData.cover_url ? (
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "100%",
                      height: 140,
                      backgroundImage: `url(${formData.cover_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderRadius: 8,
                      border: "2px solid rgba(59,130,246,0.3)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, cover_url: undefined })}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.9)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 140,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.05)",
                    border: "2px dashed rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    fontSize: 12,
                  }}
                >
                  Sem imagem
                </div>
              )}
            </div>
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleImageUpload(e, "cover")}
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(59,130,246,0.35)",
                background: "rgba(59,130,246,0.12)",
                color: "#93c5fd",
                cursor: uploadingCover ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 700,
                opacity: uploadingCover ? 0.6 : 1,
              }}
            >
              {uploadingCover ? "⏳ A carregar..." : "📤 Carregar Capa"}
            </button>
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
              JPG, PNG. Máx 5MB. Recomendado: 1200x300px.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Slug (URL do Cartão)</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            URL pública: kardme.com/emb/{formData.slug || "seu-slug"}
          </p>
        </div>

        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "rgba(124,58,237,0.1)",
            borderRadius: 8,
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 12,
              marginTop: 0,
            }}
          >
            🎨 Tema & Cores
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Fundo do Cartão</label>
            <ColorPickerPro
              value={formData.background_color || "#ffffff"}
              onChange={(val) => setFormData({ ...formData, background_color: val })}
              onEyedropper={() =>
                openPicker({
                  mode: "eyedropper",
                  onPick: (hex) => setFormData({ ...formData, background_color: hex }),
                })
              }
              supportsGradient={true}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Cor do Texto</label>
            <ColorPickerPro
              value={formData.text_color || "#000000"}
              onChange={(val) => setFormData({ ...formData, text_color: val })}
              onEyedropper={() =>
                openPicker({
                  mode: "eyedropper",
                  onPick: (hex) => setFormData({ ...formData, text_color: hex }),
                })
              }
              supportsGradient={false}
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={labelStyle}>Tipo de Fonte</label>
            <FontPicker
              value={formData.font_family || ""}
              onChange={(val) => setFormData({ ...formData, font_family: val })}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
            📝 Campos do Formulário
          </h3>

          {formData.default_fields && formData.default_fields.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {formData.default_fields.map((field) => (
                <label
                  key={field.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#cbd5e1",
                    fontSize: 12,
                    cursor: "pointer",
                    marginBottom: 6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) => {
                      const updated = formData.default_fields?.map((f) =>
                        f.id === field.id ? { ...f, enabled: e.target.checked } : f
                      );
                      setFormData({ ...formData, default_fields: updated });
                    }}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          )}

          {formData.custom_fields.map((field) => (
            <div
              key={field.id}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={field.label}
                  disabled
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#cbd5e1",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) => {
                      const updated = formData.custom_fields.map((f) =>
                        f.id === field.id ? { ...f, enabled: e.target.checked } : f
                      );
                      setFormData({ ...formData, custom_fields: updated });
                    }}
                  />
                  <span>Ativo</span>
                </label>
                <button
                  onClick={() => removeCustomField(field.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(239,68,68,0.3)",
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Remover
                </button>
              </div>

              {field.type === "select" && (
                <div style={{ marginTop: 8 }}>
                  <label style={{ ...labelStyle, marginBottom: 6 }}>Opções (uma por linha)</label>
                  <textarea
                    value={(field.options || []).join("\n")}
                    onChange={(e) => {
                      const options = e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean);

                      const updated = formData.custom_fields.map((f) =>
                        f.id === field.id ? { ...f, options } : f
                      );
                      setFormData({ ...formData, custom_fields: updated });
                    }}
                    style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  />
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            {!showAddField ? (
              <button
                onClick={() => setShowAddField(true)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(59,130,246,0.35)",
                  background: "rgba(59,130,246,0.12)",
                  color: "#93c5fd",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                + Adicionar campo personalizado
              </button>
            ) : (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Label do campo"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    style={{
                      ...inputStyle,
                      width: 160,
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    <option value="text">Texto</option>
                    <option value="textarea">Texto longo</option>
                    <option value="select">Select</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={addCustomField}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(34,197,94,0.35)",
                      background: "rgba(34,197,94,0.12)",
                      color: "#86efac",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddField(false);
                      setNewFieldLabel("");
                      setNewFieldType("text");
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.35)",
                      background: "rgba(148,163,184,0.12)",
                      color: "#cbd5e1",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "#cbd5e1",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Fechar
          </button>

          <button
            onClick={handlePublish}
            disabled={!canPublish || publishLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(168,85,247,0.35)",
              background: canPublish ? "rgba(168,85,247,0.15)" : "rgba(107,114,128,0.1)",
              color: canPublish ? "#d8b4fe" : "#9ca3af",
              cursor: canPublish ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              opacity: canPublish ? 1 : 0.5,
            }}
          >
            {publishLoading ? "..." : formData.is_published ? "Despublicar" : "Publicar"}
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid rgba(59,130,246,0.35)",
              background: "rgba(59,130,246,0.15)",
              color: "#93c5fd",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Guardando..." : "Guardar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AmbassadorEditModal(props: AmbassadorEditModalProps) {
  return (
    <ColorPickerProvider>
      <AmbassadorEditModalContent {...props} />
    </ColorPickerProvider>
  );
}
