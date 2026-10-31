"use client";

/* eslint-disable @next/next/no-img-element -- uploaded files, shown at their own size */
import { ExternalLink, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

type Props = {
  file: string;
  title: string;
  /** What the visitor clicks: a label, a thumbnail… */
  children: ReactNode;
  className?: string;
  labels: { openInNewTab: string; close: string };
};

/**
 * Opens a PDF or an image in a modal. Without JavaScript the trigger is a
 * plain link to the file, so it stays reachable.
 */
export function MediaViewer({ file, title, children, className, labels }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The file only loads after the first open.
  const [opened, setOpened] = useState(false);
  const isPdf = file.toLowerCase().endsWith(".pdf");

  return (
    <>
      <a
        href={file}
        target="_blank"
        rel="noopener"
        className={className}
        onClick={(event) => {
          if (!dialog.current?.showModal) return;
          event.preventDefault();
          setOpened(true);
          dialog.current.showModal();
        }}
      >
        {children}
      </a>
      <dialog
        ref={dialog}
        className={`viewer${isPdf ? " is-pdf" : ""}`}
        aria-label={title}
        // A click on the backdrop lands on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="viewer-inner">
          <div className="viewer-bar">
            <span className="viewer-title">{title}</span>
            <a href={file} target="_blank" rel="noopener" className="btn btn-tertiary btn-small">
              <ExternalLink aria-hidden />
              {labels.openInNewTab}
            </a>
            <button
              type="button"
              className="btn btn-tertiary btn-icon"
              aria-label={labels.close}
              autoFocus
              onClick={() => dialog.current?.close()}
            >
              <X aria-hidden />
            </button>
          </div>
          {opened &&
            (isPdf ? (
              <iframe src={file} title={title} className="viewer-frame" />
            ) : (
              <div className="viewer-image">
                <img src={file} alt={title} />
              </div>
            ))}
        </div>
      </dialog>
    </>
  );
}
