<?php

namespace Ernestdefoe\Lectern;

use Flarum\Foundation\AbstractServiceProvider;
use FoF\Upload\Helpers\Util;
use Illuminate\Contracts\Container\Container;

/** Adds the PDF viewer to FoF Upload's list of templates. */
class UploadTemplateProvider extends AbstractServiceProvider
{
    public function register(): void
    {
        $this->container->extend(Util::class, function (Util $util, Container $container) {
            $util->addRenderTemplate($container->make(PdfTemplate::class));

            return $util;
        });
    }
}
