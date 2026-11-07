<?php

namespace Ernestdefoe\Lectern;

use FoF\Upload\Templates\AbstractTextFormatterTemplate;
use Illuminate\Contracts\View\View;

/**
 * A FoF Upload template that shows a PDF as a card the reader can open.
 *
 * The card keeps FoF Upload's own download button (data-fof-upload-download-uuid),
 * so download permissions, per-tag scoping and the locked state all come from
 * FoF Upload itself. Lectern only adds the View button in the browser.
 */
class PdfTemplate extends AbstractTextFormatterTemplate
{
    /**
     * @var string
     */
    protected $tag = 'lectern';

    public function name(): string
    {
        return $this->trans('ernestdefoe-lectern.admin.template.name');
    }

    public function description(): string
    {
        return $this->trans('ernestdefoe-lectern.admin.template.description');
    }

    public function template(): View
    {
        return $this->getView('ernestdefoe-lectern::pdf');
    }

    public function bbcode(): string
    {
        return '[upl-lectern uuid={IDENTIFIER} size={SIMPLETEXT2}]{TEXT1}[/upl-lectern]';
    }
}
