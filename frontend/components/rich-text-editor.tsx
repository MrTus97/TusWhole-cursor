"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  minHeight?: number;
}

type EditorInstance = Awaited<
  ReturnType<
    typeof import("@ckeditor/ckeditor5-build-classic")["default"]["create"]
  >
>;

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  editorClassName,
  minHeight = 360,
}: RichTextEditorProps) {
  const editorElementRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<EditorInstance | null>(null);
  const latestDataRef = useRef<string>(value);
  const onChangeRef = useRef(onChange);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;
    let editor: EditorInstance | null = null;

    async function createEditor() {
      try {
        const { default: ClassicEditor } = await import(
          "@ckeditor/ckeditor5-build-classic"
        );

        if (!isMounted || !editorElementRef.current) {
          return;
        }

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

        editor = await ClassicEditor.create(editorElementRef.current, {
          placeholder: placeholder || "Viết nhật ký của bạn...",
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "underline",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "insertTable",
            "uploadImage",
            "|",
            "undo",
            "redo",
          ],
          simpleUpload: {
            uploadUrl: `${API_BASE_URL}/api/journal/uploads/`,
            withCredentials: false,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          },
          image: {
            toolbar: [
              "imageStyle:alignLeft",
              "imageStyle:full",
              "imageStyle:alignRight",
              "|",
              "imageTextAlternative",
            ],
          },
          table: {
            contentToolbar: [
              "tableColumn",
              "tableRow",
              "mergeTableCells",
              "toggleTableCaption",
            ],
          },
        });

        if (!editor) {
          return;
        }

        editorInstanceRef.current = editor;
        const initialValue = latestDataRef.current ?? "";
        editor.setData(initialValue);
        const root = editor.editing.view.document.getRoot();
        if (root) {
          editor.editing.view.change((writer) => {
            writer.setStyle(
              "min-height",
              `${Math.max(minHeight, 240)}px`,
              root
            );
            writer.setStyle(
              "max-height",
              `${Math.max(minHeight, 240)}px`,
              root
            );
            writer.setStyle("overflow-y", "auto", root);
          });
        }
        editor.model.document.on("change:data", () => {
          const data = editor?.getData() ?? "";
          if (data === latestDataRef.current) {
            return;
          }
          latestDataRef.current = data;
          onChangeRef.current?.(data);
        });
        setIsReady(true);
      } catch (error) {
        console.error("Không thể khởi tạo CKEditor:", error);
        if (isMounted) {
          setLoadError(
            "Không thể tải trình soạn thảo. Vui lòng tải lại trang."
          );
        }
      }
    }

    createEditor();

    return () => {
      isMounted = false;
      if (editor) {
        editor.destroy().catch(() => null);
      }
    };
  }, [placeholder, minHeight]);

  useEffect(() => {
    const editor = editorInstanceRef.current;
    if (editor && value !== latestDataRef.current) {
      editor.setData(value);
      latestDataRef.current = value;
    }
  }, [value]);

  return (
    <div
      className={cn(
        "relative rounded-md border border-border bg-white shadow-sm",
        className
      )}
    >
      {!isReady && !loadError && (
        <div className="px-3 py-2 text-sm text-gray-500">
          Đang tải trình soạn thảo...
        </div>
      )}
      {loadError && (
        <div className="px-3 py-2 text-sm text-red-500">{loadError}</div>
      )}
      <div
        ref={editorElementRef}
        className={cn(
          "bg-white resize-y rounded-b-md overflow-hidden",
          editorClassName
        )}
        style={{ minHeight }}
      />
    </div>
  );
}
