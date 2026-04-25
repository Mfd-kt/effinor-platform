"use client"

import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react"
import CharacterCount from "@tiptap/extension-character-count"
import Heading from "@tiptap/extension-heading"
import TipTapImage from "@tiptap/extension-image"
import TipTapLink from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@/lib/utils"

interface TipTapEditorProps {
  content?: Record<string, unknown> | null
  onChange: (html: string, json: Record<string, unknown>) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-sm transition-colors",
        "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-muted font-semibold text-primary",
      )}
    >
      {children}
    </button>
  )
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Commencez à écrire votre article…",
  className,
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    // Next.js 15+/16 SSR : éviter le mismatch d'hydratation
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // On gère heading séparément pour limiter à H2/H3
        heading: false,
        codeBlock: {
          HTMLAttributes: {
            class: "rounded bg-muted p-4 font-mono text-sm",
          },
        },
      }),
      Heading.configure({ levels: [2, 3] }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-secondary-600 underline underline-offset-2",
        },
      }),
      TipTapImage.configure({
        HTMLAttributes: {
          class: "my-4 max-w-full rounded-lg",
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: content ?? undefined,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON() as Record<string, unknown>)
    },
  })

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        Chargement de l&apos;éditeur…
      </div>
    )
  }

  const wordCount = editor.storage.characterCount?.words?.() ?? 0

  const addLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("URL du lien :", previous ?? "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt("URL de l'image :")
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background",
        className,
      )}
    >
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border p-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Gras (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italique (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Barré"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            title="Code inline"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="Titre H2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="Titre H3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Citation"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Séparateur horizontal"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={addLink}
            active={editor.isActive("link")}
            title="Insérer un lien"
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton onClick={addImage} title="Insérer une image par URL">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <div className="mx-1 h-5 w-px bg-border" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>

          <div className="ml-auto pr-2 text-xs text-muted-foreground">
            {wordCount} mot{wordCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none p-4",
          "focus:outline-none",
          "[&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        )}
      />
    </div>
  )
}
